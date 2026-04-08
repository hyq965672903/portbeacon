use sysinfo::{ProcessesToUpdate, System};
use tauri::{AppHandle, Emitter};

use crate::core::history::{insert_history_event, query_history};
use crate::core::models::{
    HistoryEventPO, HistoryEventVO, HistoryListQO, KillProcessQO, PortListQO, PortListVO,
    PortServiceVO, ProcessSnapshot, ProcessTreeNodeVO,
};
use crate::core::ports::process::{
    build_service, get_process_tree as build_process_tree, stop_process,
};
use crate::core::ports::scanner::scan_port_snapshots;

/// 查询历史记录并返回给前端展示。
#[tauri::command]
pub fn list_history(request: HistoryListQO) -> Result<Vec<HistoryEventVO>, String> {
    query_history(request)
}

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
    let request = NormalizedPortListQO::from(request);
    let snapshots = scan_port_snapshots()?;
    let mut system = System::new_all();
    system.refresh_processes(ProcessesToUpdate::All, true);

    let mut services = Vec::new();

    for snapshot in snapshots.values() {
        let service = build_service(
            &system,
            snapshot.key.clone(),
            snapshot.port,
            snapshot.protocol.clone(),
            snapshot.pid,
        );

        if !request.matches_scope(&service) || !request.matches_search(&service) {
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

    Ok(PortListVO {
        items,
        total,
        page: request.page,
        page_size: request.page_size,
    })
}

/// 后端内部使用的标准化端口列表查询对象。
struct NormalizedPortListQO {
    /// 当前页码。
    page: usize,
    /// 每页记录数。
    page_size: usize,
    /// 标准化后的搜索关键词。
    search: String,
    /// 标准化后的列表范围。
    scope: String,
    /// 是否只展示关注端口。
    pinned_only: bool,
    /// 关注端口列表。
    pinned_ports: Vec<u16>,
}

impl From<PortListQO> for NormalizedPortListQO {
    fn from(request: PortListQO) -> Self {
        Self {
            page: request.page.max(1),
            page_size: request.page_size.clamp(1, 100),
            search: request.search.unwrap_or_default().trim().to_lowercase(),
            scope: request.scope.unwrap_or_else(|| "development".to_string()),
            pinned_only: request.pinned_only.unwrap_or(false),
            pinned_ports: request.pinned_ports.unwrap_or_default(),
        }
    }
}

impl NormalizedPortListQO {
    fn matches_search(&self, service: &PortServiceVO) -> bool {
        self.search.is_empty() || self.searchable_text(service).contains(&self.search)
    }

    fn matches_scope(&self, service: &PortServiceVO) -> bool {
        if self.pinned_only && !self.pinned_ports.contains(&service.port) {
            return false;
        }

        if self.scope == "all" {
            return true;
        }

        service.classification.visibility == "focused"
    }

    fn searchable_text(&self, service: &PortServiceVO) -> String {
        format!(
            "{} {} {} {} {} {} {} {} {} {}",
            service.port,
            service.pid,
            service.name,
            service.location,
            service.attribution.display_name,
            service
                .attribution
                .source_app
                .as_deref()
                .unwrap_or_default(),
            service.attribution.launcher.as_deref().unwrap_or_default(),
            service.attribution.framework.as_deref().unwrap_or_default(),
            service.attribution.project.as_deref().unwrap_or_default(),
            service.classification.category
        )
        .to_lowercase()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalizes_pagination_inputs() {
        let request = NormalizedPortListQO::from(PortListQO {
            page: 0,
            page_size: 500,
            search: Some("  Node  ".to_string()),
            scope: None,
            pinned_only: None,
            pinned_ports: None,
        });

        assert_eq!(request.page, 1);
        assert_eq!(request.page_size, 100);
        assert_eq!(request.search, "node");
    }
}
