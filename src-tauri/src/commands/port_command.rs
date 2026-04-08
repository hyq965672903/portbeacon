use tauri::{AppHandle, Emitter};

use crate::modules::history::model::HistoryEventPO;
use crate::modules::history::service::insert_history_event;
use crate::modules::port::model::{
    KillProcessQO, PortListQO, PortListVO, ProcessSnapshot, ProcessTreeNodeVO,
};
use crate::modules::port::process::{get_process_tree as build_process_tree, stop_process};
use crate::modules::port::service::list_ports as query_ports;

/// 手动停止目标进程，并写入历史记录。
#[tauri::command]
pub fn kill_process(app: AppHandle, request: KillProcessQO) -> Result<(), String> {
    let event = match stop_process(&request) {
        Ok(snapshot) => HistoryEventPO::manual_stop(&request, &snapshot, "success", None),
        Err(error) => HistoryEventPO::manual_stop(
            &request,
            &ProcessSnapshot::fallback(request.pid),
            "failed",
            Some(error.clone()),
        ),
    };

    let result = if event.result == "success" {
        Ok(())
    } else {
        Err(event
            .error
            .clone()
            .unwrap_or_else(|| "failed to stop process".to_string()))
    };

    insert_history_event(&event)?;
    let _ = app.emit("history-updated", ());

    result
}

/// 查询目标 PID 的进程链详情。
#[tauri::command]
pub fn get_process_tree(pid: u32) -> Result<Option<ProcessTreeNodeVO>, String> {
    Ok(build_process_tree(pid))
}

/// 查询端口列表，并按搜索、范围和关注端口进行过滤分页。
#[tauri::command]
pub fn list_ports(request: PortListQO) -> Result<PortListVO, String> {
    query_ports(request)
}
