//! 5. 归因打分：对模糊场景做 owner / source / project / service / internal 分组证据打分。

use crate::modules::analysis::context::owner_text;
use crate::modules::analysis::model::{AttributionScore, ProcessEvidence, SourceRule};
use crate::modules::analysis::source::is_development_source;

/// 计算模糊场景的归因分数，硬规则仍由 classification 优先处理。
pub(crate) fn score_attribution(
    port: u16,
    source: Option<&SourceRule>,
    launcher: Option<&String>,
    framework: Option<&String>,
    known_service: Option<&String>,
    runtime: Option<&String>,
    has_project_context: bool,
    owner_name: &str,
    owner_location: &str,
    chain: &[ProcessEvidence],
) -> AttributionScore {
    let mut score = AttributionScore::default();

    if let Some(runtime) = runtime {
        score.owner += 30;
        score
            .reasons
            .push(format!("owner 是运行时进程：{runtime} +30"));
    }

    if let Some(source) = source.filter(|source| is_development_source(source)) {
        score.source += 25;
        score
            .reasons
            .push(format!("来源是开发相关工具：{} +25", source.display));
    }

    if has_project_context {
        score.project += 40;
        score
            .reasons
            .push("存在项目目录或项目文件上下文 +40".to_string());
    }

    if let Some(launcher) = launcher {
        score.service += 45;
        score
            .reasons
            .push(format!("命中开发启动器：{launcher} +45"));
    }

    if let Some(framework) = framework {
        score.service += 45;
        score.reasons.push(format!("命中框架：{framework} +45"));
    }

    if let Some(service) = known_service {
        score.service += 45;
        score.reasons.push(format!("命中服务指纹：{service} +45"));
    }

    if is_named_dev_port(port) {
        score.service += 25;
        score
            .reasons
            .push(format!("端口 {port} 命中常见开发服务端口画像 +25"));
    }

    let owner_text = owner_text(owner_name, owner_location, chain);
    if owner_text.contains(".app/contents") {
        score.internal -= 35;
        score.reasons.push("owner 位于应用包内部 -35".to_string());
    }
    if owner_text.contains("/usr/libexec/") || owner_text.contains("/system/library/") {
        score.internal -= 50;
        score.reasons.push("owner 位于系统后台目录 -50".to_string());
    }
    score
}

/// 常见的用户项目服务端口画像，只作为 service 证据之一，不能单独决定分类。
fn is_named_dev_port(port: u16) -> bool {
    matches!(
        port,
        3000 | 3001 | 4173 | 5173 | 8000 | 8001 | 8080..=8090 | 8888 | 9000
    )
}
