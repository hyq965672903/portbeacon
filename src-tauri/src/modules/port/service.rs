use sysinfo::{ProcessesToUpdate, System};

use crate::modules::port::model::{PortListQO, PortListVO, PortServiceVO};
use crate::modules::port::process::build_service;
use crate::modules::port::scanner::scan_port_snapshots;

/// 查询端口列表，并按搜索、范围和关注端口进行过滤。
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

    Ok(PortListVO {
        items: services,
        total,
    })
}

/// 后端内部使用的标准化端口列表查询对象。
struct NormalizedPortListQO {
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
    fn normalizes_search_input() {
        let request = NormalizedPortListQO::from(PortListQO {
            search: Some("  Node  ".to_string()),
            scope: None,
            pinned_only: None,
            pinned_ports: None,
        });

        assert_eq!(request.search, "node");
    }
}
