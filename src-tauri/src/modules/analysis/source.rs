//! 2. 来源追溯：沿进程链识别直接来源和上游来源，例如 IDEA、Codex、Antigravity、Terminal。

use crate::modules::analysis::model::{ProcessEvidence, SourceKind, SourceRule, SOURCE_RULES};

/// 选择距离监听进程最近且有解释力的来源应用。
pub(crate) fn best_source(chain: &[ProcessEvidence]) -> Option<&'static SourceRule> {
    for item in chain.iter().rev() {
        for kind in [
            SourceKind::Ide,
            SourceKind::AiIde,
            SourceKind::AiAgent,
            SourceKind::Terminal,
            SourceKind::Lifestyle,
            SourceKind::Browser,
            SourceKind::System,
        ] {
            if let Some(rule) = SOURCE_RULES
                .iter()
                .find(|rule| rule.kind == kind && matches_rule(rule, item))
            {
                return Some(rule);
            }
        }
    }

    None
}

/// 查找只应作为上游上下文展示的更高层来源应用。
pub(crate) fn best_upstream_source(
    chain: &[ProcessEvidence],
    selected_display: &str,
) -> Option<&'static SourceRule> {
    for item in chain {
        for kind in [SourceKind::AiAgent, SourceKind::AiIde, SourceKind::Ide] {
            if let Some(rule) = SOURCE_RULES.iter().find(|rule| {
                rule.kind == kind && rule.display != selected_display && matches_rule(rule, item)
            }) {
                return Some(rule);
            }
        }
    }

    None
}

/// 检查来源规则，不使用 cwd 以避免项目路径误判。
pub(crate) fn matches_rule(rule: &SourceRule, item: &ProcessEvidence) -> bool {
    let text = source_text(item);
    rule.needles
        .iter()
        .any(|needle| text.contains(&needle.to_ascii_lowercase()))
}

/// 将内部来源类型映射为前端来源类型字符串。
pub(crate) fn source_type_label(kind: SourceKind) -> &'static str {
    match kind {
        SourceKind::AiAgent => "ai-agent",
        SourceKind::AiIde => "ai-ide",
        SourceKind::Ide => "ide",
        SourceKind::Terminal => "terminal",
        SourceKind::Lifestyle => "lifestyle-app",
        SourceKind::Browser => "browser",
        SourceKind::System => "system-service",
    }
}

/// 判断来源是否可以作为开发启动来源，而不是后台负证据。
pub(crate) fn is_development_source(source: &SourceRule) -> bool {
    matches!(
        source.kind,
        SourceKind::AiAgent | SourceKind::AiIde | SourceKind::Ide | SourceKind::Terminal
    )
}

/// 仅根据进程身份信息构建来源匹配文本。
fn source_text(item: &ProcessEvidence) -> String {
    format!(
        "{} {} {}",
        item.name,
        item.command.as_deref().unwrap_or_default(),
        item.executable.as_deref().unwrap_or_default()
    )
    .to_ascii_lowercase()
}
