use tauri::{AppHandle, Emitter};

use crate::modules::analysis::{
    delete_feedback_rule, list_feedback_rules, save_feedback_rule, set_active_fingerprint_enabled,
    UserFeedbackRule,
};
use crate::modules::history::model::HistoryEventPO;
use crate::modules::history::service::insert_history_event;
use crate::modules::port::model::{
    KillProcessQO, PortAnalysisConfigQO, PortListQO, PortListVO, PortMonitorConfigQO,
    ProcessSnapshot, ProcessTreeNodeVO,
};
use crate::modules::port::monitor::set_monitor_interval_seconds;
use crate::modules::port::process::{
    clear_attribution_cache, get_process_tree as build_process_tree, stop_process,
};
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
    let _ = app.emit("ports-updated", ());

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

/// 更新后台端口监控配置。
#[tauri::command]
pub fn set_port_monitor_config(request: PortMonitorConfigQO) -> Result<(), String> {
    set_monitor_interval_seconds(request.interval_seconds);
    Ok(())
}

/// 更新端口分析配置。
#[tauri::command]
pub fn set_port_analysis_config(request: PortAnalysisConfigQO) -> Result<(), String> {
    set_active_fingerprint_enabled(request.active_fingerprint_enabled);
    clear_attribution_cache();
    Ok(())
}

/// 查询用户归因修正规则。
#[tauri::command]
pub fn list_port_rules() -> Result<Vec<UserFeedbackRule>, String> {
    list_feedback_rules()
}

/// 新增或更新用户归因修正规则。
#[tauri::command]
pub fn save_port_rule(
    app: AppHandle,
    rule: UserFeedbackRule,
) -> Result<Vec<UserFeedbackRule>, String> {
    let rules = save_feedback_rule(rule)?;
    clear_attribution_cache();
    let _ = app.emit("ports-updated", ());
    Ok(rules)
}

/// 删除用户归因修正规则。
#[tauri::command]
pub fn delete_port_rule(app: AppHandle, id: String) -> Result<Vec<UserFeedbackRule>, String> {
    let rules = delete_feedback_rule(&id)?;
    clear_attribution_cache();
    let _ = app.emit("ports-updated", ());
    Ok(rules)
}
