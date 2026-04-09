//! 8. 端口集合后处理：在单端口分析完成后，利用同一进程的多端口关系修正默认展示结果。

use std::collections::HashMap;

use crate::modules::port::model::PortServiceVO;

/// 根据同一 PID 暴露的端口集合修正分类。
///
/// 典型场景：IDEA 启动一个 Java 应用后，同一个 Java 进程可能同时监听业务端口
/// `8888` 和一个动态范围内的内部辅助端口。单端口分析只能看到 `java + IDEA`
/// 这组证据，容易把两个端口都判成开发端口；集合后处理会保留更像主服务的端口，
/// 并把缺少明确服务证据的动态端口默认折叠。
pub(crate) fn refine_port_set_classification(services: &mut [PortServiceVO]) {
    let mut ports_by_pid = HashMap::<u32, Vec<usize>>::new();

    for (index, service) in services.iter().enumerate() {
        if service.pid == 0 {
            continue;
        }
        ports_by_pid.entry(service.pid).or_default().push(index);
    }

    for indexes in ports_by_pid.values() {
        if indexes.len() <= 1 {
            continue;
        }

        let has_primary_focused_port = indexes.iter().any(|index| {
            let service = &services[*index];
            service.classification.visibility == "focused"
                && !is_dynamic_private_port(service.port)
                && looks_like_primary_service_port(service)
        });

        if !has_primary_focused_port {
            continue;
        }

        for index in indexes {
            let service = &mut services[*index];
            if should_collapse_auxiliary_port(service) {
                service.classification.visibility = "collapsed".to_string();
                service.classification.category = "internal-port".to_string();
                service.classification.collapsed_reason =
                    Some("同一进程已有主开发端口，当前端口疑似内部辅助端口".to_string());
                service
                    .attribution
                    .score_reasons
                    .push("同一 PID 已有主开发端口，动态端口作为辅助端口默认折叠".to_string());
            }
        }
    }
}

/// 判断端口是否处在 IANA 动态/私有端口范围。
fn is_dynamic_private_port(port: u16) -> bool {
    (49152..=65535).contains(&port)
}

/// 判断端口是否具备主服务端口特征。
fn looks_like_primary_service_port(service: &PortServiceVO) -> bool {
    has_explicit_service_evidence(service) || !is_dynamic_private_port(service.port)
}

/// 判断端口是否应该作为同一进程的辅助端口默认折叠。
fn should_collapse_auxiliary_port(service: &PortServiceVO) -> bool {
    service.classification.visibility == "focused"
        && is_dynamic_private_port(service.port)
        && !has_explicit_service_evidence(service)
}

/// 判断是否存在足以把某个端口单独视为服务端口的明确证据。
fn has_explicit_service_evidence(service: &PortServiceVO) -> bool {
    service.attribution.launcher.is_some()
        || service.attribution.framework.is_some()
        || service.classification.category == "database"
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::modules::port::model::{PortAttributionVO, PortClassificationVO, PortServiceVO};

    fn service(port: u16, pid: u32, launcher: Option<&str>) -> PortServiceVO {
        PortServiceVO {
            id: format!("tcp:{port}:{pid}"),
            port,
            protocol: "tcp".to_string(),
            pid,
            name: "java".to_string(),
            status: "active".to_string(),
            uptime: "1m".to_string(),
            location: "java".to_string(),
            memory: "1 MB".to_string(),
            updated_at: "now".to_string(),
            attribution: PortAttributionVO {
                display_name: "Java".to_string(),
                summary: String::new(),
                summary_en: String::new(),
                source_app: Some("IntelliJ IDEA".to_string()),
                source_type: "ide".to_string(),
                launcher: launcher.map(str::to_string),
                runtime: Some("Java".to_string()),
                framework: None,
                project: None,
                confidence: "medium".to_string(),
                score_total: 0,
                score_reasons: Vec::new(),
                evidence: Vec::new(),
                chain: Vec::new(),
            },
            classification: PortClassificationVO {
                category: "dev-server".to_string(),
                visibility: "focused".to_string(),
                collapsed_reason: None,
            },
        }
    }

    #[test]
    fn collapses_dynamic_auxiliary_port_when_same_pid_has_primary_port() {
        let mut services = vec![service(8888, 42, None), service(53493, 42, None)];

        refine_port_set_classification(&mut services);

        assert_eq!(services[0].classification.visibility, "focused");
        assert_eq!(services[1].classification.visibility, "collapsed");
        assert_eq!(services[1].classification.category, "internal-port");
    }

    #[test]
    fn keeps_single_dynamic_service_port_when_no_primary_sibling_exists() {
        let mut services = vec![service(53493, 42, None)];

        refine_port_set_classification(&mut services);

        assert_eq!(services[0].classification.visibility, "focused");
    }

    #[test]
    fn keeps_dynamic_port_with_explicit_launcher_evidence() {
        let mut services = vec![
            service(8888, 42, None),
            service(53493, 42, Some("pnpm dev")),
        ];

        refine_port_set_classification(&mut services);

        assert_eq!(services[1].classification.visibility, "focused");
    }
}
