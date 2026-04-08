//! 6. 归因分类：执行高确定性硬规则，并决定端口进入开发端口视图还是默认折叠。

use crate::modules::analysis::context::{owner_evidence, owner_text};
use crate::modules::analysis::model::{
    AttributionScore, ProcessEvidence, SourceKind, SourceRule, SOURCE_RULES,
};
use crate::modules::analysis::source::matches_rule;
use crate::modules::port::model::PortClassificationVO;

/// 判断端口是否应进入默认开发端口列表。
pub(crate) fn classify(
    launcher: Option<&String>,
    framework: Option<&String>,
    known_service: Option<&String>,
    score: &AttributionScore,
    owner_name: &str,
    owner_location: &str,
    chain: &[ProcessEvidence],
) -> PortClassificationVO {
    if let Some(owner_rule) = owner_source_rule(owner_name, owner_location, chain) {
        match owner_rule.kind {
            SourceKind::Lifestyle => return collapsed("lifestyle-app", "生活软件后台端口"),
            SourceKind::Browser => return collapsed("browser", "浏览器后台端口"),
            SourceKind::System => return collapsed("system-service", "系统服务端口"),
            SourceKind::AiAgent => {
                if known_service.is_some() {
                    return visible("ai-agent");
                }

                return collapsed("tool-background", "AI Agent 辅助端口");
            }
            SourceKind::AiIde | SourceKind::Ide
                if owner_is_app_bundle(owner_name, owner_location, chain) =>
            {
                return collapsed("tool-background", "开发工具自身后台端口");
            }
            _ => {}
        }
    }

    if owner_is_system_path(owner_name, owner_location, chain) {
        return collapsed("system-service", "系统服务端口");
    }

    if framework.is_some() || launcher.is_some() {
        return visible("dev-server");
    }

    if known_service.is_some() {
        return visible("database");
    }

    if meets_development_gate(score) {
        return visible("dev-server");
    }

    if score.owner > 0 {
        return collapsed("unknown", "运行时进程缺少来源或项目上下文");
    }

    collapsed("unknown", "非关注端口")
}

/// 只根据监听进程本身判断是否命中系统、生活软件、浏览器或工具本体。
fn owner_source_rule(
    owner_name: &str,
    owner_location: &str,
    chain: &[ProcessEvidence],
) -> Option<&'static SourceRule> {
    let owner = owner_evidence(owner_name, owner_location, chain);
    SOURCE_RULES.iter().find(|rule| matches_rule(rule, &owner))
}

/// 判断 owner 自身是否位于 macOS 应用包内部。
fn owner_is_app_bundle(owner_name: &str, owner_location: &str, chain: &[ProcessEvidence]) -> bool {
    owner_text(owner_name, owner_location, chain).contains(".app/contents")
}

/// 判断 owner 自身是否属于系统目录。
fn owner_is_system_path(owner_name: &str, owner_location: &str, chain: &[ProcessEvidence]) -> bool {
    let text = owner_text(owner_name, owner_location, chain);
    text.contains("/usr/libexec/")
        || text.contains("/system/library/")
        || text.contains("/usr/sbin/")
        || text.contains("/sbin/")
}

/// 开发端口成立条件：owner 必须像服务进程，并且不能只靠 source 抬分。
fn meets_development_gate(score: &AttributionScore) -> bool {
    let owner_like_service = score.owner > 0;
    let source_evidence = score.source > 0;
    let project_evidence = score.project > 0;
    let service_evidence = score.service > 0;

    owner_like_service
        && service_evidence
        && (project_evidence || (source_evidence && score.service >= 45))
}

/// 构建默认可见的分类 VO。
fn visible(category: &str) -> PortClassificationVO {
    PortClassificationVO {
        category: category.to_string(),
        visibility: "focused".to_string(),
        collapsed_reason: None,
    }
}

/// 构建默认折叠的分类 VO，并附带用户可读原因。
fn collapsed(category: &str, reason: &str) -> PortClassificationVO {
    PortClassificationVO {
        category: category.to_string(),
        visibility: "collapsed".to_string(),
        collapsed_reason: Some(reason.to_string()),
    }
}
