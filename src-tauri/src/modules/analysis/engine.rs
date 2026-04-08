//! 1. 分析入口和流程编排：接收端口事实，按 2-7 步编排分析流程，最后生成前端 VO。

use crate::modules::analysis::classification::classify;
use crate::modules::analysis::context::{
    collect_evidence, compact_label, confidence, detect_framework, detect_launcher, detect_project,
    detect_runtime, has_project_context,
};
use crate::modules::analysis::fingerprint::detect_service_fingerprint;
use crate::modules::analysis::model::ProcessEvidence;
use crate::modules::analysis::scoring::score_attribution;
use crate::modules::analysis::source::{best_source, best_upstream_source, source_type_label};
use crate::modules::port::model::{PortAttributionVO, PortClassificationVO};

/// 根据进程证据推断前端归因 VO 和列表分类 VO。
pub fn infer_port_context(
    port: u16,
    owner_name: &str,
    owner_location: &str,
    chain: &[ProcessEvidence],
) -> (PortAttributionVO, PortClassificationVO) {
    let source = best_source(chain);
    let upstream_source = source
        .as_ref()
        .and_then(|source| best_upstream_source(chain, source.display));
    let launcher = detect_launcher(chain);
    let framework = detect_framework(chain, owner_name, owner_location);
    let runtime = detect_runtime(owner_name, owner_location, chain);
    let known_service = detect_service_fingerprint(port, source);
    let project = detect_project(chain);
    let has_project_context = has_project_context(chain);
    let score = score_attribution(
        port,
        source,
        launcher.as_ref(),
        framework.as_ref(),
        known_service.as_ref(),
        runtime.as_ref(),
        has_project_context,
        owner_name,
        owner_location,
        chain,
    );
    let chain_labels = chain.iter().map(compact_label).collect::<Vec<_>>();
    let evidence = collect_evidence(
        source,
        launcher.as_ref(),
        framework.as_deref(),
        known_service.as_deref(),
        project.as_deref(),
        has_project_context,
    );
    let display_name = framework
        .clone()
        .or_else(|| known_service.clone())
        .or_else(|| runtime.clone())
        .unwrap_or_else(|| owner_name.to_string());
    let source_app = source.as_ref().map(|source| source.display.to_string());
    let source_type = source
        .as_ref()
        .map(|source| source_type_label(source.kind).to_string())
        .unwrap_or_else(|| "unknown".to_string());
    let confidence = confidence(
        source,
        launcher.as_ref(),
        framework.as_ref(),
        project.as_ref(),
    );
    let classification = classify(
        launcher.as_ref(),
        framework.as_ref(),
        known_service.as_ref(),
        &score,
        owner_name,
        owner_location,
        chain,
    );
    let summary = build_summary(
        port,
        source_app.as_deref(),
        upstream_source.map(|source| source.display),
        project.as_deref(),
        launcher.as_deref(),
        framework.as_deref().or(known_service.as_deref()),
        runtime.as_deref(),
        &display_name,
    );
    let summary_en = build_summary_en(
        port,
        source_app.as_deref(),
        upstream_source.map(|source| source.display),
        project.as_deref(),
        launcher.as_deref(),
        framework.as_deref().or(known_service.as_deref()),
        runtime.as_deref(),
        &display_name,
    );

    (
        PortAttributionVO {
            display_name,
            summary,
            summary_en,
            source_app,
            source_type,
            launcher,
            runtime,
            framework,
            project,
            confidence: confidence.to_string(),
            score_total: score.total(),
            score_reasons: score.reasons,
            evidence,
            chain: chain_labels,
        },
        classification,
    )
}

/// 构建详情抽屉展示的中文归因摘要。
fn build_summary(
    port: u16,
    source_app: Option<&str>,
    upstream_source: Option<&str>,
    project: Option<&str>,
    launcher: Option<&str>,
    framework: Option<&str>,
    runtime: Option<&str>,
    display_name: &str,
) -> String {
    let service = framework.or(runtime).unwrap_or(display_name);

    let mut summary = match (source_app, project, launcher, framework) {
        (Some(source), Some(project), Some(launcher), Some(framework)) => format!(
            "{source} 在项目 {project} 中通过 {launcher} 启动了 {framework}，占用了 :{port}。"
        ),
        (Some(source), Some(project), _, _) => {
            format!("{source} 在项目 {project} 中启动了 {service}，占用了 :{port}。")
        }
        (Some(source), _, Some(launcher), Some(framework)) => {
            format!("{source} 通过 {launcher} 启动了 {framework}，占用了 :{port}。")
        }
        (Some(source), _, _, _) => format!("{source} 启动的 {service} 正在占用 :{port}。"),
        (_, Some(project), Some(launcher), Some(framework)) => {
            format!("项目 {project} 中的 {launcher} 启动了 {framework}，占用了 :{port}。")
        }
        (_, _, _, Some(framework)) => format!("{framework} 正在占用 :{port}，启动来源未确认。"),
        _ => format!("{display_name} 正在占用 :{port}，启动来源未确认。"),
    };

    if let Some(upstream) = upstream_source {
        summary.push_str(&format!(" 上游进程包含 {upstream}。"));
    }

    summary
}

#[cfg(test)]
mod tests {
    use super::*;

    fn evidence(name: &str, executable: &str, cwd: Option<&str>) -> ProcessEvidence {
        ProcessEvidence {
            name: name.to_string(),
            command: Some(executable.to_string()),
            executable: Some(executable.to_string()),
            cwd: cwd.map(str::to_string),
        }
    }

    #[test]
    fn ide_launched_java_is_development_port() {
        let chain = vec![
            evidence("launchd", "/sbin/launchd", None),
            evidence(
                "idea",
                "/Applications/IntelliJ IDEA.app/Contents/MacOS/idea",
                None,
            ),
            evidence(
                "java",
                "/Users/huyq/Library/Java/JavaVirtualMachines/corretto-17.0.15/Contents/Home/bin/java",
                Some(env!("CARGO_MANIFEST_DIR")),
            ),
        ];

        let (_, classification) = infer_port_context(8888, "java", "java", &chain);

        assert_eq!(classification.visibility, "focused");
        assert_eq!(classification.category, "dev-server");
    }

    #[test]
    fn ide_launched_java_auxiliary_port_stays_collapsed_without_service_feature() {
        let chain = vec![
            evidence("launchd", "/sbin/launchd", None),
            evidence(
                "idea",
                "/Applications/IntelliJ IDEA.app/Contents/MacOS/idea",
                None,
            ),
            evidence(
                "java",
                "/Users/huyq/Library/Java/JavaVirtualMachines/corretto-17.0.15/Contents/Home/bin/java",
                Some(env!("CARGO_MANIFEST_DIR")),
            ),
        ];

        let (_, classification) = infer_port_context(53493, "java", "java", &chain);

        assert_eq!(classification.visibility, "collapsed");
        assert_eq!(classification.category, "unknown");
    }

    #[test]
    fn ai_agent_owner_port_stays_collapsed_without_service_fingerprint() {
        let chain = vec![
            evidence("launchd", "/sbin/launchd", None),
            evidence("openclaw", "/Users/huyq/.local/bin/openclaw", None),
        ];

        let (_, classification) =
            infer_port_context(1, "openclaw", "/Users/huyq/.local/bin/openclaw", &chain);

        assert_eq!(classification.visibility, "collapsed");
        assert_eq!(classification.category, "tool-background");
    }

    #[test]
    fn ai_agent_owner_auxiliary_port_stays_collapsed_without_service_fingerprint() {
        let chain = vec![
            evidence("launchd", "/sbin/launchd", None),
            evidence("openclaw", "/Users/huyq/.local/bin/openclaw", None),
        ];

        let (_, classification) =
            infer_port_context(18790, "openclaw", "/Users/huyq/.local/bin/openclaw", &chain);

        assert_eq!(classification.visibility, "collapsed");
        assert_eq!(classification.category, "tool-background");
    }

    #[test]
    fn jetbrains_owner_itself_is_collapsed_as_tool_background() {
        let chain = vec![
            evidence("launchd", "/sbin/launchd", None),
            evidence(
                "rustrover",
                "/Applications/RustRover.app/Contents/MacOS/rustrover",
                None,
            ),
        ];

        let (_, classification) = infer_port_context(
            6192,
            "rustrover",
            "/Applications/RustRover.app/Contents/MacOS/rustrover",
            &chain,
        );

        assert_eq!(classification.visibility, "collapsed");
        assert_eq!(classification.category, "tool-background");
    }

    #[test]
    fn bare_runtime_without_source_or_project_context_stays_collapsed() {
        let chain = vec![
            evidence("launchd", "/sbin/launchd", None),
            evidence("node", "/usr/local/bin/node", None),
        ];

        let (_, classification) = infer_port_context(8080, "node", "/usr/local/bin/node", &chain);

        assert_eq!(classification.visibility, "collapsed");
        assert_eq!(classification.category, "unknown");
    }
}

/// 构建详情抽屉展示的英文归因摘要。
fn build_summary_en(
    port: u16,
    source_app: Option<&str>,
    upstream_source: Option<&str>,
    project: Option<&str>,
    launcher: Option<&str>,
    framework: Option<&str>,
    runtime: Option<&str>,
    display_name: &str,
) -> String {
    let service = framework.or(runtime).unwrap_or(display_name);

    let mut summary = match (source_app, project, launcher, framework) {
        (Some(source), Some(project), Some(launcher), Some(framework)) => format!(
            "{source} started {framework} in project {project} through {launcher}, occupying :{port}."
        ),
        (Some(source), Some(project), _, _) => {
            format!("{source} started {service} in project {project}, occupying :{port}.")
        }
        (Some(source), _, Some(launcher), Some(framework)) => {
            format!("{source} started {framework} through {launcher}, occupying :{port}.")
        }
        (Some(source), _, _, _) => {
            format!("{source} started {service}, which is occupying :{port}.")
        }
        (_, Some(project), Some(launcher), Some(framework)) => {
            format!("{launcher} started {framework} in project {project}, occupying :{port}.")
        }
        (_, _, _, Some(framework)) => {
            format!("{framework} is occupying :{port}; the launch source is not confirmed.")
        }
        _ => format!("{display_name} is occupying :{port}; the launch source is not confirmed."),
    };

    if let Some(upstream) = upstream_source {
        summary.push_str(&format!(" The upstream process chain includes {upstream}."));
    }

    summary
}
