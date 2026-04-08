use tauri::AppHandle;

use crate::modules::history::model::{HistoryEventPO, HistoryEventVO, HistoryListQO};
use crate::modules::history::repository;

/// 初始化历史记录数据库。
pub fn init_history_database(app: AppHandle) -> Result<(), String> {
    repository::init_history_database(app)
}

/// 写入历史事件并裁剪旧记录。
pub fn insert_history_event(event: &HistoryEventPO) -> Result<(), String> {
    repository::insert_history_event(event)
}

/// 查询历史事件并转换为前端 VO。
pub fn query_history(request: HistoryListQO) -> Result<Vec<HistoryEventVO>, String> {
    repository::query_history(request).map(|events| {
        events
            .into_iter()
            .map(HistoryEventVO::from)
            .collect::<Vec<_>>()
    })
}
