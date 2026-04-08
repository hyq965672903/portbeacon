use serde::{Deserialize, Serialize};

/// 端口列表查询对象，由前端传入后端。
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PortListQO {
    /// 当前页码，从 1 开始。
    pub page: usize,
    /// 每页记录数。
    pub page_size: usize,
    /// 搜索关键词，支持端口、PID、服务名、路径和归因字段。
    pub search: Option<String>,
    /// 列表范围，development 表示开发端口，all 表示全部端口。
    pub scope: Option<String>,
    /// 是否只展示用户关注的端口。
    pub pinned_only: Option<bool>,
    /// 用户关注的端口号列表，仅用于本次查询过滤。
    pub pinned_ports: Option<Vec<u16>>,
}

/// 历史记录查询对象，由前端传入后端。
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryListQO {
    /// 搜索关键词。
    pub search: Option<String>,
    /// 动作类型过滤，例如 detected、released、stopped。
    pub action: Option<String>,
    /// 指定端口过滤。
    pub port: Option<u16>,
    /// 时间范围过滤，例如 1h、24h、7d、all。
    pub range: Option<String>,
    /// 返回记录上限。
    pub limit: Option<usize>,
}

/// 停止进程查询对象，由前端传入后端。
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KillProcessQO {
    /// 目标进程 PID。
    pub pid: u32,
    /// 目标端口号。
    pub port: u16,
    /// 端口协议，例如 tcp 或 udp。
    pub protocol: Option<String>,
}

/// 端口扫描快照，供后端内部比对和构建 VO 使用。
#[derive(Clone, Debug)]
pub struct PortSnapshot {
    /// 快照唯一键。
    pub key: String,
    /// 端口号。
    pub port: u16,
    /// 端口协议。
    pub protocol: String,
    /// 端口所属进程 PID。
    pub pid: u32,
    /// 进程名称。
    pub process_name: String,
    /// 进程可执行文件路径。
    pub location: String,
}

/// 进程快照，供后端内部写入手动停止历史使用。
#[derive(Debug)]
pub struct ProcessSnapshot {
    /// 进程 PID。
    pub pid: u32,
    /// 进程名称。
    pub name: String,
    /// 进程可执行文件路径。
    pub location: String,
}

impl ProcessSnapshot {
    pub fn fallback(pid: u32) -> Self {
        Self {
            pid,
            name: "Unknown process".to_string(),
            location: "-".to_string(),
        }
    }
}

/// 端口服务视图对象，返回给前端展示。
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PortServiceVO {
    /// 端口记录唯一 ID。
    pub id: String,
    /// 端口号。
    pub port: u16,
    /// 端口协议。
    pub protocol: String,
    /// 端口所属进程 PID。
    pub pid: u32,
    /// 原始进程名称。
    pub name: String,
    /// 端口状态。
    pub status: String,
    /// 进程运行时长。
    pub uptime: String,
    /// 进程可执行文件路径。
    pub location: String,
    /// CPU 使用率展示值。
    pub cpu: String,
    /// 内存占用展示值。
    pub memory: String,
    /// 数据更新时间展示值。
    pub updated_at: String,
    /// 端口来源归因信息。
    pub attribution: PortAttributionVO,
    /// 端口分类和可见性信息。
    pub classification: PortClassificationVO,
}

/// 端口来源归因视图对象，返回给前端展示。
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PortAttributionVO {
    /// 列表和详情中展示的服务名。
    pub display_name: String,
    /// 中文归因摘要。
    pub summary: String,
    /// 英文归因摘要。
    pub summary_en: String,
    /// 识别到的直接来源应用，例如 IntelliJ IDEA、Codex。
    pub source_app: Option<String>,
    /// 来源类型，例如 ai-agent、ai-ide、ide、terminal。
    pub source_type: String,
    /// 启动命令或启动器，例如 pnpm dev、Gradle。
    pub launcher: Option<String>,
    /// 运行时类型，例如 Node.js、Java、Python。
    pub runtime: Option<String>,
    /// 框架类型，例如 Next.js、Vite、Spring Boot。
    pub framework: Option<String>,
    /// 推断出的项目名称。
    pub project: Option<String>,
    /// 归因置信度，high、medium 或 low。
    pub confidence: String,
    /// 命中的证据类型列表。
    pub evidence: Vec<String>,
    /// 简化后的进程链标签。
    pub chain: Vec<String>,
}

/// 端口分类视图对象，返回给前端用于列表筛选。
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PortClassificationVO {
    /// 分类标识，例如 dev-server、system-service、ide-background。
    pub category: String,
    /// 可见性，focused 表示默认开发端口可见，hidden 表示默认隐藏。
    pub visibility: String,
    /// 被隐藏时的原因说明。
    pub hidden_reason: Option<String>,
}

/// 进程树节点视图对象，返回给前端详情抽屉展示。
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessTreeNodeVO {
    /// 节点进程 PID。
    pid: u32,
    /// 父进程 PID。
    parent_pid: Option<u32>,
    /// 进程名称。
    name: String,
    /// 进程命令行。
    command: Option<String>,
    /// 进程可执行文件路径。
    executable: Option<String>,
    /// 进程工作目录。
    cwd: Option<String>,
    /// 子进程节点。
    children: Vec<ProcessTreeNodeVO>,
}

impl ProcessTreeNodeVO {
    pub fn new(
        pid: u32,
        parent_pid: Option<u32>,
        name: String,
        command: Option<String>,
        executable: Option<String>,
        cwd: Option<String>,
    ) -> Self {
        Self {
            pid,
            parent_pid,
            name,
            command,
            executable,
            cwd,
            children: Vec::new(),
        }
    }

    pub fn push_child(&mut self, child: ProcessTreeNodeVO) {
        self.children.push(child);
    }
}

/// 历史事件持久化对象，对应 SQLite history_events 表。
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryEventPO {
    /// 历史事件 ID。
    pub id: String,
    /// 事件发生时间戳，毫秒。
    pub timestamp: i64,
    /// 事件端口号。
    pub port: u16,
    /// 端口协议。
    pub protocol: String,
    /// 关联进程 PID。
    pub pid: Option<u32>,
    /// 进程名称。
    pub process_name: String,
    /// 事件动作，例如 detected、released、stopped。
    pub action: String,
    /// 事件来源，例如 monitor、manual。
    pub source: String,
    /// 执行结果，例如 success、failed。
    pub result: String,
    /// 进程可执行文件路径。
    pub location: String,
    /// 事件原因说明。
    pub reason: Option<String>,
    /// 错误信息。
    pub error: Option<String>,
}

impl HistoryEventPO {
    pub fn from_snapshot(action: &str, snapshot: &PortSnapshot, reason: &str) -> Self {
        let timestamp = crate::core::time::timestamp_ms();
        Self {
            id: format!(
                "{}:{}:{}:{}",
                timestamp, snapshot.protocol, snapshot.port, snapshot.pid
            ),
            timestamp,
            port: snapshot.port,
            protocol: snapshot.protocol.clone(),
            pid: (snapshot.pid != 0).then_some(snapshot.pid),
            process_name: snapshot.process_name.clone(),
            action: action.to_string(),
            source: "monitor".to_string(),
            result: "success".to_string(),
            location: snapshot.location.clone(),
            reason: Some(reason.to_string()),
            error: None,
        }
    }

    pub fn monitor_error(error: String) -> Self {
        let timestamp = crate::core::time::timestamp_ms();
        Self {
            id: format!("{timestamp}:monitor-error"),
            timestamp,
            port: 0,
            protocol: "system".to_string(),
            pid: None,
            process_name: "PortBeacon Monitor".to_string(),
            action: "failed".to_string(),
            source: "monitor".to_string(),
            result: "failed".to_string(),
            location: "-".to_string(),
            reason: Some("Port monitor scan failed".to_string()),
            error: Some(error),
        }
    }

    pub fn manual_stop(
        request: &KillProcessQO,
        process: &ProcessSnapshot,
        result: &str,
        error: Option<String>,
    ) -> Self {
        let timestamp = crate::core::time::timestamp_ms();
        let protocol = request
            .protocol
            .as_deref()
            .filter(|protocol| !protocol.is_empty())
            .unwrap_or("tcp");

        Self {
            id: format!(
                "{}:{}:{}:{}:manual-stop",
                timestamp, protocol, request.port, request.pid
            ),
            timestamp,
            port: request.port,
            protocol: protocol.to_string(),
            pid: Some(process.pid),
            process_name: process.name.clone(),
            action: "stopped".to_string(),
            source: "manual".to_string(),
            result: result.to_string(),
            location: process.location.clone(),
            reason: Some("User requested process stop".to_string()),
            error,
        }
    }
}

/// 端口列表分页视图对象，返回给前端展示。
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PortListVO {
    /// 当前页端口记录。
    pub items: Vec<PortServiceVO>,
    /// 过滤后的总记录数。
    pub total: usize,
    /// 当前页码。
    pub page: usize,
    /// 每页记录数。
    pub page_size: usize,
}

/// 历史事件视图对象，返回给前端展示。
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryEventVO {
    /// 历史事件 ID。
    pub id: String,
    /// 事件发生时间戳，毫秒。
    pub timestamp: i64,
    /// 事件端口号。
    pub port: u16,
    /// 端口协议。
    pub protocol: String,
    /// 关联进程 PID。
    pub pid: Option<u32>,
    /// 进程名称。
    pub process_name: String,
    /// 事件动作，例如 detected、released、stopped。
    pub action: String,
    /// 事件来源，例如 monitor、manual。
    pub source: String,
    /// 执行结果，例如 success、failed。
    pub result: String,
    /// 进程可执行文件路径。
    pub location: String,
    /// 事件原因说明。
    pub reason: Option<String>,
    /// 错误信息。
    pub error: Option<String>,
}

impl From<HistoryEventPO> for HistoryEventVO {
    fn from(event: HistoryEventPO) -> Self {
        Self {
            id: event.id,
            timestamp: event.timestamp,
            port: event.port,
            protocol: event.protocol,
            pid: event.pid,
            process_name: event.process_name,
            action: event.action,
            source: event.source,
            result: event.result,
            location: event.location,
            reason: event.reason,
            error: event.error,
        }
    }
}
