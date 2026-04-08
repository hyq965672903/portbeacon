use std::path::Path;

use crate::core::models::{PortAttribution, PortClassification};

#[derive(Clone, Debug)]
pub struct ProcessEvidence {
    pub name: String,
    pub command: Option<String>,
    pub executable: Option<String>,
    pub cwd: Option<String>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum SourceKind {
    AiAgent,
    AiIde,
    Ide,
    Terminal,
    Lifestyle,
    Browser,
    System,
}

struct SourceRule {
    display: &'static str,
    kind: SourceKind,
    needles: &'static [&'static str],
}

const SOURCE_RULES: &[SourceRule] = &[
    SourceRule {
        display: "OpenClaw",
        kind: SourceKind::AiAgent,
        needles: &["openclaw"],
    },
    SourceRule {
        display: "Codex",
        kind: SourceKind::AiAgent,
        needles: &["codex"],
    },
    SourceRule {
        display: "Claude Code",
        kind: SourceKind::AiAgent,
        needles: &["claude"],
    },
    SourceRule {
        display: "Roo",
        kind: SourceKind::AiAgent,
        needles: &["roo-code", "roo code", "roocode"],
    },
    SourceRule {
        display: "Gemini CLI",
        kind: SourceKind::AiAgent,
        needles: &["gemini"],
    },
    SourceRule {
        display: "Aider",
        kind: SourceKind::AiAgent,
        needles: &["aider"],
    },
    SourceRule {
        display: "Qwen Code",
        kind: SourceKind::AiAgent,
        needles: &["qwen"],
    },
    SourceRule {
        display: "Trae",
        kind: SourceKind::AiIde,
        needles: &["trae"],
    },
    SourceRule {
        display: "Cursor",
        kind: SourceKind::AiIde,
        needles: &["cursor"],
    },
    SourceRule {
        display: "Windsurf",
        kind: SourceKind::AiIde,
        needles: &["windsurf"],
    },
    SourceRule {
        display: "Antigravity",
        kind: SourceKind::AiIde,
        needles: &["antigravity"],
    },
    SourceRule {
        display: "Qoder",
        kind: SourceKind::AiIde,
        needles: &["qoder"],
    },
    SourceRule {
        display: "IntelliJ IDEA",
        kind: SourceKind::Ide,
        needles: &["intellij idea", "idea.app"],
    },
    SourceRule {
        display: "WebStorm",
        kind: SourceKind::Ide,
        needles: &["webstorm"],
    },
    SourceRule {
        display: "PyCharm",
        kind: SourceKind::Ide,
        needles: &["pycharm"],
    },
    SourceRule {
        display: "GoLand",
        kind: SourceKind::Ide,
        needles: &["goland"],
    },
    SourceRule {
        display: "VS Code",
        kind: SourceKind::Ide,
        needles: &["visual studio code", "code.app", "/code ", " vscode"],
    },
    SourceRule {
        display: "Zed",
        kind: SourceKind::Ide,
        needles: &["zed.app", "/zed"],
    },
    SourceRule {
        display: "Terminal",
        kind: SourceKind::Terminal,
        needles: &[
            "terminal.app",
            "iterm",
            "wezterm",
            "alacritty",
            "zsh",
            "bash",
            "fish",
        ],
    },
    SourceRule {
        display: "WeChat",
        kind: SourceKind::Lifestyle,
        needles: &["wechat", "微信"],
    },
    SourceRule {
        display: "Feishu",
        kind: SourceKind::Lifestyle,
        needles: &["feishu", "lark"],
    },
    SourceRule {
        display: "Slack",
        kind: SourceKind::Lifestyle,
        needles: &["slack"],
    },
    SourceRule {
        display: "O+Connect",
        kind: SourceKind::Lifestyle,
        needles: &["o+connect"],
    },
    SourceRule {
        display: "DingTalk",
        kind: SourceKind::Lifestyle,
        needles: &["dingtalk"],
    },
    SourceRule {
        display: "Chrome",
        kind: SourceKind::Browser,
        needles: &["google chrome", "chrome.app"],
    },
    SourceRule {
        display: "Safari",
        kind: SourceKind::Browser,
        needles: &["safari.app"],
    },
    SourceRule {
        display: "Firefox",
        kind: SourceKind::Browser,
        needles: &["firefox"],
    },
    SourceRule {
        display: "macOS sharing service",
        kind: SourceKind::System,
        needles: &[
            "sharingd",
            "mDNSResponder",
            "rapportd",
            "controlcenter",
            "apsd",
        ],
    },
];

pub fn infer_port_context(
    port: u16,
    owner_name: &str,
    owner_location: &str,
    chain: &[ProcessEvidence],
) -> (PortAttribution, PortClassification) {
    let source = best_source(chain);
    let upstream_source = source
        .as_ref()
        .and_then(|source| best_upstream_source(chain, source.display));
    let launcher = detect_launcher(chain);
    let framework = detect_framework(chain, owner_name, owner_location);
    let runtime = detect_runtime(owner_name, owner_location, chain);
    let project = detect_project(chain);
    let chain_labels = chain.iter().map(compact_label).collect::<Vec<_>>();
    let evidence = collect_evidence(
        source,
        launcher.as_ref(),
        framework.as_deref(),
        project.as_deref(),
    );
    let display_name = framework
        .clone()
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
        port,
        source,
        launcher.as_ref(),
        framework.as_ref(),
        runtime.as_ref(),
        owner_name,
        owner_location,
    );
    let summary = build_summary(
        port,
        source_app.as_deref(),
        upstream_source.map(|source| source.display),
        project.as_deref(),
        launcher.as_deref(),
        framework.as_deref(),
        runtime.as_deref(),
        &display_name,
    );
    let summary_en = build_summary_en(
        port,
        source_app.as_deref(),
        upstream_source.map(|source| source.display),
        project.as_deref(),
        launcher.as_deref(),
        framework.as_deref(),
        runtime.as_deref(),
        &display_name,
    );

    (
        PortAttribution {
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
            evidence,
            chain: chain_labels,
        },
        classification,
    )
}

fn best_source(chain: &[ProcessEvidence]) -> Option<&'static SourceRule> {
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

fn best_upstream_source(
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

fn matches_rule(rule: &SourceRule, item: &ProcessEvidence) -> bool {
    let text = source_text(item);
    rule.needles
        .iter()
        .any(|needle| text.contains(&needle.to_ascii_lowercase()))
}

fn source_text(item: &ProcessEvidence) -> String {
    format!(
        "{} {} {}",
        item.name,
        item.command.as_deref().unwrap_or_default(),
        item.executable.as_deref().unwrap_or_default()
    )
    .to_ascii_lowercase()
}

fn searchable_text(item: &ProcessEvidence) -> String {
    format!(
        "{} {} {} {}",
        item.name,
        item.command.as_deref().unwrap_or_default(),
        item.executable.as_deref().unwrap_or_default(),
        item.cwd.as_deref().unwrap_or_default()
    )
    .to_ascii_lowercase()
}

fn detect_launcher(chain: &[ProcessEvidence]) -> Option<String> {
    let text = chain
        .iter()
        .map(searchable_text)
        .collect::<Vec<_>>()
        .join(" ");

    if text.contains("pnpm") && text.contains("dev") {
        Some("pnpm dev".to_string())
    } else if text.contains("npm") && text.contains("run") && text.contains("dev") {
        Some("npm run dev".to_string())
    } else if text.contains("yarn") && text.contains("dev") {
        Some("yarn dev".to_string())
    } else if text.contains("bun") && text.contains("dev") {
        Some("bun dev".to_string())
    } else if text.contains("uvicorn") {
        Some("uvicorn".to_string())
    } else if text.contains("gradle") || text.contains("gradlew") {
        Some("Gradle".to_string())
    } else if text.contains("mvn") || text.contains("maven") {
        Some("Maven".to_string())
    } else if text.contains("cargo run") {
        Some("cargo run".to_string())
    } else {
        None
    }
}

fn detect_framework(
    chain: &[ProcessEvidence],
    owner_name: &str,
    owner_location: &str,
) -> Option<String> {
    let mut text = chain
        .iter()
        .map(searchable_text)
        .collect::<Vec<_>>()
        .join(" ");
    text.push(' ');
    text.push_str(&owner_name.to_ascii_lowercase());
    text.push(' ');
    text.push_str(&owner_location.to_ascii_lowercase());

    if text.contains("next dev")
        || text.contains("next-server")
        || text.contains("/next/")
        || text.contains(".next")
    {
        Some("Next.js".to_string())
    } else if text.contains("vite") {
        Some("Vite".to_string())
    } else if text.contains("nuxt") {
        Some("Nuxt".to_string())
    } else if text.contains("astro") {
        Some("Astro".to_string())
    } else if text.contains("remix") {
        Some("Remix".to_string())
    } else if text.contains("sveltekit") || text.contains("svelte-kit") {
        Some("SvelteKit".to_string())
    } else if text.contains("uvicorn") || text.contains("fastapi") {
        Some("Uvicorn".to_string())
    } else if text.contains("spring") || text.contains("spring-boot") {
        Some("Spring Boot".to_string())
    } else {
        None
    }
}

fn detect_runtime(
    owner_name: &str,
    owner_location: &str,
    chain: &[ProcessEvidence],
) -> Option<String> {
    let text = format!(
        "{} {} {}",
        owner_name,
        owner_location,
        chain
            .iter()
            .map(searchable_text)
            .collect::<Vec<_>>()
            .join(" ")
    )
    .to_ascii_lowercase();

    if text.contains("node") {
        Some("Node.js".to_string())
    } else if text.contains("python") || text.contains("uvicorn") {
        Some("Python".to_string())
    } else if text.contains("java") {
        Some("Java".to_string())
    } else if text.contains("cargo") || text.contains("rust") {
        Some("Rust".to_string())
    } else if text.contains("go run") || text.ends_with("/go") {
        Some("Go".to_string())
    } else {
        None
    }
}

fn detect_project(chain: &[ProcessEvidence]) -> Option<String> {
    chain
        .iter()
        .rev()
        .filter_map(|item| item.cwd.as_deref())
        .filter(|cwd| !cwd.is_empty() && *cwd != "/" && !cwd.starts_with("/Applications/"))
        .filter_map(|cwd| Path::new(cwd).file_name().and_then(|name| name.to_str()))
        .filter(|name| !name.is_empty())
        .map(|name| name.to_string())
        .next()
}

fn compact_label(item: &ProcessEvidence) -> String {
    if let Some(command) = item
        .command
        .as_deref()
        .filter(|command| !command.is_empty())
    {
        command
            .split_whitespace()
            .take(3)
            .collect::<Vec<_>>()
            .join(" ")
    } else {
        item.name.clone()
    }
}

fn collect_evidence(
    source: Option<&SourceRule>,
    launcher: Option<&String>,
    framework: Option<&str>,
    project: Option<&str>,
) -> Vec<String> {
    let mut evidence = Vec::new();

    if source.is_some() {
        evidence.push("process-chain".to_string());
    }
    if launcher.is_some() || framework.is_some() {
        evidence.push("command".to_string());
    }
    if project.is_some() {
        evidence.push("cwd".to_string());
    }

    evidence
}

fn confidence(
    source: Option<&SourceRule>,
    launcher: Option<&String>,
    framework: Option<&String>,
    project: Option<&String>,
) -> &'static str {
    let score = usize::from(source.is_some())
        + usize::from(launcher.is_some())
        + usize::from(framework.is_some())
        + usize::from(project.is_some());

    if score >= 3 {
        "high"
    } else if score >= 1 {
        "medium"
    } else {
        "low"
    }
}

fn classify(
    port: u16,
    source: Option<&SourceRule>,
    launcher: Option<&String>,
    framework: Option<&String>,
    runtime: Option<&String>,
    owner_name: &str,
    owner_location: &str,
) -> PortClassification {
    if framework.is_some() || launcher.is_some() {
        return visible("dev-server");
    }

    if runtime.is_some() && is_common_dev_port(port) {
        return visible("dev-server");
    }

    if let Some(source) = source {
        match source.kind {
            SourceKind::Lifestyle => return hidden("lifestyle-app", "生活软件后台端口"),
            SourceKind::Browser => return hidden("browser", "浏览器后台端口"),
            SourceKind::System => return hidden("system-service", "系统服务端口"),
            SourceKind::AiAgent | SourceKind::AiIde | SourceKind::Ide => {
                return hidden("ide-background", "开发工具自身后台端口");
            }
            SourceKind::Terminal => {}
        }
    }

    let owner_text = format!("{owner_name} {owner_location}").to_ascii_lowercase();
    if owner_text.contains("sharingd") || owner_text.contains("/usr/libexec/") {
        return hidden("system-service", "系统服务端口");
    }

    hidden("unknown", "非关注端口")
}

fn visible(category: &str) -> PortClassification {
    PortClassification {
        category: category.to_string(),
        visibility: "focused".to_string(),
        hidden_reason: None,
    }
}

fn hidden(category: &str, reason: &str) -> PortClassification {
    PortClassification {
        category: category.to_string(),
        visibility: "hidden".to_string(),
        hidden_reason: Some(reason.to_string()),
    }
}

fn is_common_dev_port(port: u16) -> bool {
    (3000..=9999).contains(&port) || matches!(port, 5173 | 4173 | 8000 | 8080)
}

fn source_type_label(kind: SourceKind) -> &'static str {
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
