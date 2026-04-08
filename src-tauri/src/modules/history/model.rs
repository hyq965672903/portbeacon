use serde::{Deserialize, Serialize};

use crate::modules::port::model::{KillProcessQO, PortSnapshot, ProcessSnapshot};
use crate::utils::time::timestamp_ms;

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
    /// 根据端口扫描快照生成监控历史事件。
    pub fn from_snapshot(action: &str, snapshot: &PortSnapshot, reason: &str) -> Self {
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

    /// 生成后台端口监控失败事件。
    pub fn monitor_error(error: String) -> Self {
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

    /// 生成用户手动停止进程历史事件。
    pub fn manual_stop(
        request: &KillProcessQO,
        process: &ProcessSnapshot,
        result: &str,
        error: Option<String>,
    ) -> Self {
        let timestamp = timestamp_ms();
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
