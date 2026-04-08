use std::collections::{HashMap, HashSet};
use std::sync::{Mutex, OnceLock};
use std::time::Duration;

use sysinfo::{Pid, ProcessesToUpdate, System};

use crate::modules::analysis::{apply_feedback_override, infer_port_context, ProcessEvidence};
use crate::modules::port::model::{
    KillProcessQO, PortAttributionVO, PortClassificationVO, PortServiceVO, ProcessSnapshot,
    ProcessTreeNodeVO,
};

type AttributionCacheValue = (PortAttributionVO, PortClassificationVO);
static ATTRIBUTION_CACHE: OnceLock<Mutex<HashMap<String, AttributionCacheValue>>> = OnceLock::new();

/// 为监听进程构建从父到子的进程树。
pub fn get_process_tree(pid: u32) -> Option<ProcessTreeNodeVO> {
    if pid == 0 {
        return None;
    }

    let mut system = System::new_all();
    system.refresh_processes(ProcessesToUpdate::All, true);

    build_process_tree(&system, pid)
}

/// 在执行本地安全检查后停止进程。
pub fn stop_process(request: &KillProcessQO) -> Result<ProcessSnapshot, String> {
    if request.pid == 0 {
        return Err("pid 0 cannot be stopped".to_string());
    }

    if request.pid == 1 {
        return Err("pid 1 is protected and cannot be stopped".to_string());
    }

    if request.pid == std::process::id() {
        return Err("PortBeacon cannot stop its own process".to_string());
    }

    let mut system = System::new_all();
    system.refresh_processes(ProcessesToUpdate::All, true);

    let Some(process) = system.process(Pid::from_u32(request.pid)) else {
        return Err(format!("process {} was not found", request.pid));
    };

    let snapshot = ProcessSnapshot {
        pid: process.pid().as_u32(),
        name: process_name(process),
        location: process
            .exe()
            .map(|path| path.display().to_string())
            .filter(|location| !location.is_empty())
            .unwrap_or_else(|| "-".to_string()),
    };

    if !process.kill() {
        return Err(format!("system refused to stop process {}", request.pid));
    }

    Ok(snapshot)
}

/// 为单个扫描端口构建前端 VO，并附加归因元数据。
pub fn build_service(
    system: &System,
    id: String,
    port: u16,
    protocol: String,
    pid: u32,
) -> PortServiceVO {
    let process = if pid == 0 {
        None
    } else {
        system.process(Pid::from_u32(pid))
    };

    let name = process
        .map(process_name)
        .filter(|name| !name.is_empty())
        .unwrap_or_else(|| "Unknown process".to_string());
    let location = process
        .and_then(|process| process.exe().map(|path| path.display().to_string()))
        .filter(|location| !location.is_empty())
        .unwrap_or_else(|| "-".to_string());
    let status = "active".to_string();
    let uptime = process
        .map(|process| format_duration(process.run_time()))
        .unwrap_or_else(|| "-".to_string());
    let cpu = process
        .map(|process| format!("{:.1}%", process.cpu_usage()))
        .unwrap_or_else(|| "-".to_string());
    let memory = process
        .map(|process| format_memory(process.memory()))
        .unwrap_or_else(|| "-".to_string());
    let chain = collect_process_chain(system, pid);
    let evidence = chain.iter().map(ProcessEvidence::from).collect::<Vec<_>>();
    let (attribution, classification) = cached_port_context(&id, port, &name, &location, &evidence);

    PortServiceVO {
        id,
        port,
        protocol,
        pid,
        name,
        status,
        uptime,
        location,
        cpu,
        memory,
        updated_at: "now".to_string(),
        attribution,
        classification,
    }
}

/// 按 protocol:port:pid 缓存归因结果，避免同一 owner 在自动刷新中重复重算。
fn cached_port_context(
    cache_key: &str,
    port: u16,
    name: &str,
    location: &str,
    evidence: &[ProcessEvidence],
) -> AttributionCacheValue {
    let cache = ATTRIBUTION_CACHE.get_or_init(|| Mutex::new(HashMap::new()));

    if let Ok(cache) = cache.lock() {
        if let Some(value) = cache.get(cache_key) {
            return apply_feedback_to_value(value.clone(), port, name, location, evidence);
        }
    }

    let value = infer_port_context(port, name, location, evidence);
    if let Ok(mut cache) = cache.lock() {
        cache.insert(cache_key.to_string(), value.clone());
    }

    apply_feedback_to_value(value, port, name, location, evidence)
}

/// 清空归因缓存，用于规则或指纹配置变更后立即生效。
pub fn clear_attribution_cache() {
    if let Some(cache) = ATTRIBUTION_CACHE.get() {
        if let Ok(mut cache) = cache.lock() {
            cache.clear();
        }
    }
}

/// 对缓存的系统推断结果应用最新用户规则，不把用户规则结果写进缓存。
fn apply_feedback_to_value(
    value: AttributionCacheValue,
    port: u16,
    name: &str,
    location: &str,
    evidence: &[ProcessEvidence],
) -> AttributionCacheValue {
    let (attribution, classification) = value;
    let classification = apply_feedback_override(classification, port, name, location, evidence);

    (attribution, classification)
}

/// 将线性父进程链转换为嵌套进程树 VO。
fn build_process_tree(system: &System, pid: u32) -> Option<ProcessTreeNodeVO> {
    let chain = collect_process_chain(system, pid);

    chain.into_iter().fold(None, |child, item| {
        let mut parent = ProcessTreeNodeVO::new(
            item.pid,
            item.parent_pid,
            item.name,
            item.command,
            item.executable,
            item.cwd,
        );

        if let Some(child) = child {
            parent.push_child(child);
        }

        Some(parent)
    })
}

/// 收集从根祖先进程到目标进程的进程链。
pub fn collect_process_chain(system: &System, pid: u32) -> Vec<ProcessChainItem> {
    let mut current_pid = Pid::from_u32(pid);
    let mut seen = HashSet::new();
    let mut chain = Vec::new();

    loop {
        if !seen.insert(current_pid.as_u32()) {
            break;
        }

        let Some(process) = system.process(current_pid) else {
            break;
        };

        let parent_pid = process.parent();
        chain.push(ProcessChainItem {
            pid: process.pid().as_u32(),
            parent_pid: parent_pid.map(|pid| pid.as_u32()),
            name: process_name(process),
            command: process_command(process),
            executable: process.exe().map(|path| path.display().to_string()),
            cwd: process.cwd().map(|path| path.display().to_string()),
        });

        let Some(next_pid) = parent_pid else {
            break;
        };

        current_pid = next_pid;
    }

    chain.reverse();
    chain
}

/// 收集进程链证据时使用的内部结构。
#[derive(Clone, Debug)]
pub struct ProcessChainItem {
    /// 进程 PID。
    pub pid: u32,
    /// 父进程 PID。
    pub parent_pid: Option<u32>,
    /// 进程名称。
    pub name: String,
    /// 进程命令行。
    pub command: Option<String>,
    /// 进程可执行文件路径。
    pub executable: Option<String>,
    /// 进程工作目录。
    pub cwd: Option<String>,
}

impl From<&ProcessChainItem> for ProcessEvidence {
    fn from(item: &ProcessChainItem) -> Self {
        Self {
            name: item.name.clone(),
            command: item.command.clone(),
            executable: item.executable.clone(),
            cwd: item.cwd.clone(),
        }
    }
}

/// 返回适合 UI 展示的短进程名。
pub fn process_name(process: &sysinfo::Process) -> String {
    let name = process
        .name()
        .to_string_lossy()
        .to_string()
        .chars()
        .take(80)
        .collect::<String>()
        .trim()
        .to_string();

    if name.is_empty() {
        "Unknown process".to_string()
    } else {
        name
    }
}

/// 格式化进程命令行，用于展示和归因匹配。
fn process_command(process: &sysinfo::Process) -> Option<String> {
    let command = process
        .cmd()
        .iter()
        .map(|part| part.to_string_lossy())
        .collect::<Vec<_>>()
        .join(" ")
        .trim()
        .chars()
        .take(500)
        .collect::<String>();

    if command.is_empty() {
        None
    } else {
        Some(command)
    }
}

/// 格式化进程运行时长，用于紧凑表格单元格。
fn format_duration(seconds: u64) -> String {
    let duration = Duration::from_secs(seconds);
    let hours = duration.as_secs() / 3600;
    let minutes = (duration.as_secs() % 3600) / 60;

    if hours > 0 {
        format!("{hours}h {minutes}m")
    } else {
        format!("{minutes}m")
    }
}

/// 格式化内存字节数，用于紧凑表格单元格。
fn format_memory(bytes: u64) -> String {
    let mb = bytes as f64 / 1024.0 / 1024.0;

    if mb >= 1024.0 {
        format!("{:.1} GB", mb / 1024.0)
    } else {
        format!("{:.0} MB", mb)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn formats_duration_for_table_cells() {
        assert_eq!(format_duration(59), "0m");
        assert_eq!(format_duration(3_600 + 13 * 60), "1h 13m");
    }

    #[test]
    fn formats_memory_for_table_cells() {
        assert_eq!(format_memory(132 * 1024 * 1024), "132 MB");
        assert_eq!(format_memory(1536 * 1024 * 1024), "1.5 GB");
    }
}
