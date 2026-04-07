use std::collections::HashSet;
use std::time::Duration;

use netstat2::{get_sockets_info, AddressFamilyFlags, ProtocolFlags, ProtocolSocketInfo, TcpState};
use serde::{Deserialize, Serialize};
use sysinfo::{Pid, ProcessesToUpdate, System};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PortListRequest {
    page: usize,
    page_size: usize,
    search: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PortService {
    id: String,
    port: u16,
    pid: u32,
    name: String,
    status: String,
    uptime: String,
    location: String,
    cpu: String,
    memory: String,
    updated_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessTreeNode {
    pid: u32,
    parent_pid: Option<u32>,
    name: String,
    command: Option<String>,
    executable: Option<String>,
    children: Vec<ProcessTreeNode>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PortListResponse {
    items: Vec<PortService>,
    total: usize,
    page: usize,
    page_size: usize,
}

#[tauri::command]
pub fn get_process_tree(pid: u32) -> Result<Option<ProcessTreeNode>, String> {
    if pid == 0 {
        return Ok(None);
    }

    let mut system = System::new_all();
    system.refresh_processes(ProcessesToUpdate::All, true);

    Ok(build_process_tree(&system, pid))
}

#[tauri::command]
pub fn list_ports(request: PortListRequest) -> Result<PortListResponse, String> {
    let request = NormalizedPortListRequest::from(request);
    let mut system = System::new_all();
    system.refresh_processes(ProcessesToUpdate::All, true);

    let sockets = get_sockets_info(
        AddressFamilyFlags::IPV4 | AddressFamilyFlags::IPV6,
        ProtocolFlags::TCP | ProtocolFlags::UDP,
    )
    .map_err(|error| format!("failed to read sockets: {error}"))?;

    let mut seen = HashSet::new();
    let mut services = Vec::new();

    for socket in sockets {
        let (protocol, port, is_listening) = match socket.protocol_socket_info {
            ProtocolSocketInfo::Tcp(tcp) => ("tcp", tcp.local_port, tcp.state == TcpState::Listen),
            ProtocolSocketInfo::Udp(udp) => ("udp", udp.local_port, true),
        };

        if !is_listening || port == 0 {
            continue;
        }

        let pid = socket.associated_pids.first().copied().unwrap_or(0);
        let key = format!("{protocol}:{port}:{pid}");
        if !seen.insert(key.clone()) {
            continue;
        }

        let service = build_service(&system, key, port, pid);

        if !request.matches_search(&service) {
            continue;
        }

        services.push(service);
    }

    services.sort_by_key(|service| (service.port, service.pid));

    let total = services.len();
    let start = (request.page - 1) * request.page_size;
    let items = services
        .into_iter()
        .skip(start)
        .take(request.page_size)
        .collect();

    Ok(PortListResponse {
        items,
        total,
        page: request.page,
        page_size: request.page_size,
    })
}

struct NormalizedPortListRequest {
    page: usize,
    page_size: usize,
    search: String,
}

impl From<PortListRequest> for NormalizedPortListRequest {
    fn from(request: PortListRequest) -> Self {
        Self {
            page: request.page.max(1),
            page_size: request.page_size.clamp(1, 100),
            search: request.search.unwrap_or_default().trim().to_lowercase(),
        }
    }
}

impl NormalizedPortListRequest {
    fn matches_search(&self, service: &PortService) -> bool {
        self.search.is_empty()
            || format!(
                "{} {} {} {}",
                service.port, service.pid, service.name, service.location
            )
            .to_lowercase()
            .contains(&self.search)
    }
}

fn build_service(system: &System, id: String, port: u16, pid: u32) -> PortService {
    let process = if pid == 0 {
        None
    } else {
        system.process(Pid::from_u32(pid))
    };

    let name = process
        .map(|process| process.name().to_string_lossy().to_string())
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

    PortService {
        id,
        port,
        pid,
        name,
        status,
        uptime,
        location,
        cpu,
        memory,
        updated_at: "now".to_string(),
    }
}

fn build_process_tree(system: &System, pid: u32) -> Option<ProcessTreeNode> {
    if pid == 0 {
        return None;
    }

    let mut chain = Vec::new();
    let mut current_pid = Pid::from_u32(pid);
    let mut seen = HashSet::new();

    loop {
        if !seen.insert(current_pid.as_u32()) {
            break;
        }

        let Some(process) = system.process(current_pid) else {
            break;
        };

        let parent_pid = process.parent();
        chain.push(ProcessTreeNode {
            pid: process.pid().as_u32(),
            parent_pid: parent_pid.map(Pid::as_u32),
            name: process_name(process),
            command: process_command(process),
            executable: process.exe().map(|path| path.display().to_string()),
            children: Vec::new(),
        });

        let Some(next_pid) = parent_pid else {
            break;
        };

        current_pid = next_pid;
    }

    chain.into_iter().rev().fold(None, |child, mut parent| {
        if let Some(child) = child {
            parent.children.push(child);
        }
        Some(parent)
    })
}

fn process_name(process: &sysinfo::Process) -> String {
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
    fn normalizes_pagination_inputs() {
        let request = NormalizedPortListRequest::from(PortListRequest {
            page: 0,
            page_size: 500,
            search: Some("  Node  ".to_string()),
        });

        assert_eq!(request.page, 1);
        assert_eq!(request.page_size, 100);
        assert_eq!(request.search, "node");
    }

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
