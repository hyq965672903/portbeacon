use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::OnceLock;
use std::thread;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use netstat2::{get_sockets_info, AddressFamilyFlags, ProtocolFlags, ProtocolSocketInfo, TcpState};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use sysinfo::{Pid, ProcessesToUpdate, System};
use tauri::{AppHandle, Emitter, Manager};

const HISTORY_LIMIT: usize = 600;
const MONITOR_INTERVAL: Duration = Duration::from_secs(2);
static HISTORY_DB_PATH: OnceLock<PathBuf> = OnceLock::new();
static MONITOR_STARTED: AtomicBool = AtomicBool::new(false);

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PortListRequest {
    page: usize,
    page_size: usize,
    search: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryListRequest {
    search: Option<String>,
    action: Option<String>,
    port: Option<u16>,
    range: Option<String>,
    limit: Option<usize>,
}

#[derive(Clone, Debug)]
struct PortSnapshot {
    key: String,
    port: u16,
    protocol: String,
    pid: u32,
    process_name: String,
    location: String,
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

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryEntry {
    id: String,
    timestamp: i64,
    port: u16,
    protocol: String,
    pid: Option<u32>,
    process_name: String,
    action: String,
    source: String,
    result: String,
    location: String,
    reason: Option<String>,
    error: Option<String>,
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
pub fn list_history(request: HistoryListRequest) -> Result<Vec<HistoryEntry>, String> {
    query_history(request)
}

pub fn init_history_database(app: AppHandle) -> Result<(), String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("failed to resolve app data directory: {error}"))?;
    fs::create_dir_all(&data_dir)
        .map_err(|error| format!("failed to create app data directory: {error}"))?;

    let db_path = data_dir.join("portbeacon.sqlite3");
    let _ = HISTORY_DB_PATH.set(db_path);
    let connection = history_connection()?;
    migrate_history_database(&connection)?;

    Ok(())
}

pub fn start_port_monitor(app: AppHandle) {
    if MONITOR_STARTED.swap(true, Ordering::SeqCst) {
        return;
    }

    thread::spawn(move || {
        let mut previous = match scan_port_snapshots() {
            Ok(snapshots) => snapshots,
            Err(error) => {
                let _ = insert_history_event(&HistoryEntry::monitor_error(error));
                HashMap::new()
            }
        };

        loop {
            thread::sleep(MONITOR_INTERVAL);

            let current = match scan_port_snapshots() {
                Ok(snapshots) => snapshots,
                Err(error) => {
                    let _ = insert_history_event(&HistoryEntry::monitor_error(error));
                    let _ = app.emit("history-updated", ());
                    continue;
                }
            };

            let events = diff_snapshots(&previous, &current);
            if !events.is_empty() {
                for event in events {
                    let _ = insert_history_event(&event);
                }
                let _ = app.emit("history-updated", ());
            }

            previous = current;
        }
    });
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
    let snapshots = scan_port_snapshots()?;
    let mut system = System::new_all();
    system.refresh_processes(ProcessesToUpdate::All, true);

    let mut services = Vec::new();

    for snapshot in snapshots.values() {
        let service = build_service(&system, snapshot.key.clone(), snapshot.port, snapshot.pid);

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

fn diff_snapshots(
    previous: &HashMap<String, PortSnapshot>,
    current: &HashMap<String, PortSnapshot>,
) -> Vec<HistoryEntry> {
    let mut events = Vec::new();

    for (key, snapshot) in current {
        match previous.get(key) {
            None => events.push(HistoryEntry::from_snapshot(
                "detected",
                snapshot,
                "Port observed",
            )),
            Some(previous_snapshot) if previous_snapshot.pid != snapshot.pid => {
                events.push(HistoryEntry::from_snapshot(
                    "replaced",
                    snapshot,
                    "Port owner changed",
                ));
            }
            Some(_) => {}
        }
    }

    for (key, snapshot) in previous {
        if !current.contains_key(key) {
            events.push(HistoryEntry::from_snapshot(
                "released",
                snapshot,
                "Port disappeared",
            ));
        }
    }

    events
}

fn scan_port_snapshots() -> Result<HashMap<String, PortSnapshot>, String> {
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

fn timestamp_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis() as i64)
        .unwrap_or_default()
}

fn history_connection() -> Result<Connection, String> {
    let db_path = HISTORY_DB_PATH
        .get()
        .ok_or_else(|| "history database is not initialized".to_string())?;
    Connection::open(db_path).map_err(|error| format!("failed to open history database: {error}"))
}

fn migrate_history_database(connection: &Connection) -> Result<(), String> {
    connection
        .execute_batch(
            "
            CREATE TABLE IF NOT EXISTS history_events (
              id TEXT PRIMARY KEY,
              timestamp INTEGER NOT NULL,
              port INTEGER NOT NULL,
              protocol TEXT NOT NULL,
              pid INTEGER,
              process_name TEXT NOT NULL,
              action TEXT NOT NULL,
              source TEXT NOT NULL,
              result TEXT NOT NULL,
              location TEXT NOT NULL,
              reason TEXT,
              error TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_history_events_timestamp
              ON history_events(timestamp DESC);
            CREATE INDEX IF NOT EXISTS idx_history_events_port
              ON history_events(port, timestamp DESC);
            CREATE INDEX IF NOT EXISTS idx_history_events_action
              ON history_events(action, timestamp DESC);
            ",
        )
        .map_err(|error| format!("failed to migrate history database: {error}"))
}

fn insert_history_event(event: &HistoryEntry) -> Result<(), String> {
    let connection = history_connection()?;
    connection
        .execute(
            "
            INSERT OR REPLACE INTO history_events (
              id,
              timestamp,
              port,
              protocol,
              pid,
              process_name,
              action,
              source,
              result,
              location,
              reason,
              error
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
            ",
            params![
                event.id,
                event.timestamp,
                event.port,
                event.protocol,
                event.pid,
                event.process_name,
                event.action,
                event.source,
                event.result,
                event.location,
                event.reason,
                event.error,
            ],
        )
        .map_err(|error| format!("failed to insert history event: {error}"))?;
    prune_history_events(&connection)
}

fn prune_history_events(connection: &Connection) -> Result<(), String> {
    connection
        .execute(
            "
            DELETE FROM history_events
            WHERE id NOT IN (
              SELECT id FROM history_events
              ORDER BY timestamp DESC
              LIMIT ?1
            )
            ",
            params![HISTORY_LIMIT as i64],
        )
        .map_err(|error| format!("failed to prune history events: {error}"))?;
    Ok(())
}

fn query_history(request: HistoryListRequest) -> Result<Vec<HistoryEntry>, String> {
    let connection = history_connection()?;
    let limit = request.limit.unwrap_or(200).clamp(1, HISTORY_LIMIT) as i64;
    let now = timestamp_ms();
    let min_timestamp = match request.range.as_deref() {
        Some("1h") => now.saturating_sub(60 * 60 * 1000),
        Some("24h") => now.saturating_sub(24 * 60 * 60 * 1000),
        Some("7d") => now.saturating_sub(7 * 24 * 60 * 60 * 1000),
        _ => 0,
    };
    let search = request.search.unwrap_or_default().trim().to_lowercase();
    let action = request.action.unwrap_or_else(|| "all".to_string());

    let mut statement = connection
        .prepare(
            "
            SELECT id, timestamp, port, protocol, pid, process_name, action, source, result, location, reason, error
            FROM history_events
            WHERE timestamp >= ?1
              AND (?2 = 'all' OR action = ?2)
              AND (?3 IS NULL OR port = ?3)
              AND (
                ?4 = ''
                OR lower(process_name || ' ' || location || ' ' || protocol || ' ' || action || ' ' || source || ' ' || ifnull(pid, '') || ' ' || port) LIKE '%' || ?4 || '%'
              )
            ORDER BY timestamp DESC
            LIMIT ?5
            ",
        )
        .map_err(|error| format!("failed to prepare history query: {error}"))?;

    let rows = statement
        .query_map(
            params![min_timestamp, action, request.port, search, limit],
            |row| {
                Ok(HistoryEntry {
                    id: row.get(0)?,
                    timestamp: row.get(1)?,
                    port: row.get(2)?,
                    protocol: row.get(3)?,
                    pid: row.get(4)?,
                    process_name: row.get(5)?,
                    action: row.get(6)?,
                    source: row.get(7)?,
                    result: row.get(8)?,
                    location: row.get(9)?,
                    reason: row.get(10)?,
                    error: row.get(11)?,
                })
            },
        )
        .map_err(|error| format!("failed to query history events: {error}"))?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("failed to read history events: {error}"))
}

impl HistoryEntry {
    fn from_snapshot(action: &str, snapshot: &PortSnapshot, reason: &str) -> Self {
        let timestamp = timestamp_ms();
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

    fn monitor_error(error: String) -> Self {
        let timestamp = timestamp_ms();
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
