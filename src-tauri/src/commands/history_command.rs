use crate::modules::history::model::{HistoryEventVO, HistoryListQO};
use crate::modules::history::service::query_history;

/// 查询历史记录并返回给前端展示。
#[tauri::command]
pub fn list_history(request: HistoryListQO) -> Result<Vec<HistoryEventVO>, String> {
    query_history(request)
}
