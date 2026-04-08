use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PortListRequest {
    pub page: usize,
    pub page_size: usize,
    pub search: Option<String>,
    pub scope: Option<String>,
    pub pinned_only: Option<bool>,
    pub pinned_ports: Option<Vec<u16>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryListRequest {
    pub search: Option<String>,
    pub action: Option<String>,
    pub port: Option<u16>,
    pub range: Option<String>,
    pub limit: Option<usize>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KillProcessRequest {
    pub pid: u32,
    pub port: u16,
    pub protocol: Option<String>,
}

#[derive(Clone, Debug)]
pub struct PortSnapshot {
    pub key: String,
    pub port: u16,
    pub protocol: String,
    pub pid: u32,
    pub process_name: String,
    pub location: String,
}

#[derive(Debug)]
pub struct ProcessSnapshot {
    pub pid: u32,
    pub name: String,
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

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PortService {
    pub id: String,
    pub port: u16,
    pub protocol: String,
    pub pid: u32,
    pub name: String,
    pub status: String,
    pub uptime: String,
    pub location: String,
    pub cpu: String,
    pub memory: String,
    pub updated_at: String,
    pub attribution: PortAttribution,
    pub classification: PortClassification,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PortAttribution {
    pub display_name: String,
    pub summary: String,
    pub summary_en: String,
    pub source_app: Option<String>,
    pub source_type: String,
    pub launcher: Option<String>,
    pub runtime: Option<String>,
    pub framework: Option<String>,
    pub project: Option<String>,
    pub confidence: String,
    pub evidence: Vec<String>,
    pub chain: Vec<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PortClassification {
    pub category: String,
    pub visibility: String,
    pub hidden_reason: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessTreeNode {
    pid: u32,
    parent_pid: Option<u32>,
    name: String,
    command: Option<String>,
    executable: Option<String>,
    cwd: Option<String>,
    children: Vec<ProcessTreeNode>,
}

impl ProcessTreeNode {
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

    pub fn push_child(&mut self, child: ProcessTreeNode) {
        self.children.push(child);
    }
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryEntry {
    pub id: String,
    pub timestamp: i64,
    pub port: u16,
    pub protocol: String,
    pub pid: Option<u32>,
    pub process_name: String,
    pub action: String,
    pub source: String,
    pub result: String,
    pub location: String,
    pub reason: Option<String>,
    pub error: Option<String>,
}

impl HistoryEntry {
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
        request: &KillProcessRequest,
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

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PortListResponse {
    pub items: Vec<PortService>,
    pub total: usize,
    pub page: usize,
    pub page_size: usize,
}
