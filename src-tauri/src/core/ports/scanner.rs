use std::collections::{HashMap, HashSet};

use netstat2::{get_sockets_info, AddressFamilyFlags, ProtocolFlags, ProtocolSocketInfo, TcpState};
use sysinfo::{Pid, ProcessesToUpdate, System};

use crate::core::models::PortSnapshot;
use crate::core::ports::process::process_name;

/// 扫描监听中的 TCP/UDP socket，并映射到所属进程快照。
pub fn scan_port_snapshots() -> Result<HashMap<String, PortSnapshot>, String> {
    let mut system = System::new_all();
    system.refresh_processes(ProcessesToUpdate::All, true);

    let sockets = get_sockets_info(
        AddressFamilyFlags::IPV4 | AddressFamilyFlags::IPV6,
        ProtocolFlags::TCP | ProtocolFlags::UDP,
    )
    .map_err(|error| format!("failed to read sockets: {error}"))?;

    let mut snapshots = HashMap::new();
    let mut seen = HashSet::new();

    for socket in sockets {
        let (protocol, port, is_listening) = match socket.protocol_socket_info {
            ProtocolSocketInfo::Tcp(tcp) => ("tcp", tcp.local_port, tcp.state == TcpState::Listen),
            ProtocolSocketInfo::Udp(udp) => ("udp", udp.local_port, true),
        };

        if !is_listening || port == 0 {
            continue;
        }

        let pid = socket.associated_pids.first().copied().unwrap_or(0);
        let dedupe_key = format!("{protocol}:{port}:{pid}");
        if !seen.insert(dedupe_key) {
            continue;
        }

        let process = if pid == 0 {
            None
        } else {
            system.process(Pid::from_u32(pid))
        };
        let process_name = process
            .map(process_name)
            .unwrap_or_else(|| "Unknown process".to_string());
        let location = process
            .and_then(|process| process.exe().map(|path| path.display().to_string()))
            .filter(|location| !location.is_empty())
            .unwrap_or_else(|| "-".to_string());

        snapshots.insert(
            format!("{protocol}:{port}"),
            PortSnapshot {
                key: format!("{protocol}:{port}:{pid}"),
                port,
                protocol: protocol.to_string(),
                pid,
                process_name,
                location,
            },
        );
    }

    Ok(snapshots)
}
