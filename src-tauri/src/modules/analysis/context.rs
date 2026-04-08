//! 3. 上下文补全：识别 launcher / framework / runtime / project，为分类提供证据。

use std::path::Path;

use crate::modules::analysis::model::{ProcessEvidence, SourceRule};

/// 识别启动服务的命令或包管理器。
pub(crate) fn detect_launcher(chain: &[ProcessEvidence]) -> Option<String> {
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

/// 根据进程命令和可执行文件路径识别已知框架。
pub(crate) fn detect_framework(
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

/// 识别监听进程所属运行时。
pub(crate) fn detect_runtime(
    owner_name: &str,
    owner_location: &str,
    chain: &[ProcessEvidence],
) -> Option<String> {
    let text = owner_text(owner_name, owner_location, chain);

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
    } else if text.contains("orbstack") || text.contains("docker") {
        Some("Container".to_string())
    } else {
        None
    }
}

/// 根据最近可用的 cwd 推断项目名称。
pub(crate) fn detect_project(chain: &[ProcessEvidence]) -> Option<String> {
    chain.iter().rev().find_map(|item| {
        item.cwd
            .as_deref()
            .and_then(find_project_root)
            .or_else(|| {
                item.command
                    .as_deref()
                    .and_then(find_project_root_from_command)
            })
            .and_then(|path| {
                path.file_name()
                    .and_then(|name| name.to_str())
                    .map(str::to_string)
            })
    })
}

/// 判断进程链里是否存在项目上下文。
pub(crate) fn has_project_context(chain: &[ProcessEvidence]) -> bool {
    chain.iter().rev().any(|item| {
        item.cwd.as_deref().and_then(find_project_root).is_some()
            || item
                .command
                .as_deref()
                .and_then(find_project_root_from_command)
                .is_some()
    })
}

/// 为前端构建简洁的进程链标签。
pub(crate) fn compact_label(item: &ProcessEvidence) -> String {
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

/// 记录参与归因判断的证据类型。
pub(crate) fn collect_evidence(
    source: Option<&SourceRule>,
    launcher: Option<&String>,
    framework: Option<&str>,
    known_service: Option<&str>,
    project: Option<&str>,
    has_project_context: bool,
) -> Vec<String> {
    let mut evidence = Vec::new();

    if source.is_some() {
        evidence.push("process-chain".to_string());
    }
    if launcher.is_some() || framework.is_some() {
        evidence.push("command".to_string());
    }
    if known_service.is_some() {
        evidence.push("service-fingerprint".to_string());
    }
    if project.is_some() || has_project_context {
        evidence.push("cwd".to_string());
    }

    evidence
}

/// 将证据覆盖度转换为粗粒度置信度。
pub(crate) fn confidence(
    source: Option<&SourceRule>,
    launcher: Option<&String>,
    framework: Option<&String>,
    project: Option<&String>,
) -> &'static str {
    let coverage = usize::from(source.is_some())
        + usize::from(launcher.is_some())
        + usize::from(framework.is_some())
        + usize::from(project.is_some());

    if coverage >= 3 {
        "high"
    } else if coverage >= 1 {
        "medium"
    } else {
        "low"
    }
}

/// 构造仅代表监听进程 owner 的匹配文本。
pub(crate) fn owner_text(
    owner_name: &str,
    owner_location: &str,
    chain: &[ProcessEvidence],
) -> String {
    let owner = owner_evidence(owner_name, owner_location, chain);
    format!(
        "{} {} {} {} {}",
        owner_name,
        owner_location,
        owner.name,
        owner.command.as_deref().unwrap_or_default(),
        owner.executable.as_deref().unwrap_or_default()
    )
    .to_ascii_lowercase()
}

/// 构造监听进程自身证据，避免父链里的 IDE 被当成 owner 负证据。
pub(crate) fn owner_evidence(
    owner_name: &str,
    owner_location: &str,
    chain: &[ProcessEvidence],
) -> ProcessEvidence {
    chain.last().cloned().unwrap_or_else(|| ProcessEvidence {
        name: owner_name.to_string(),
        command: None,
        executable: Some(owner_location.to_string()),
        cwd: None,
    })
}

/// 构建用于启动器和框架识别的宽匹配文本。
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

/// 从命令行参数里提取可能的项目路径，并向上查找项目根目录。
fn find_project_root_from_command(command: &str) -> Option<&Path> {
    command
        .split_whitespace()
        .map(clean_path_argument)
        .filter(|part| part.starts_with('/'))
        .find_map(find_project_root)
}

/// 向上查找带项目标记文件的根目录。
fn find_project_root(path: &str) -> Option<&Path> {
    let path = Path::new(path);
    let start = if path.is_file() {
        path.parent().unwrap_or(path)
    } else {
        path
    };

    if is_ignored_context_path(start) {
        return None;
    }

    start.ancestors().take(8).find(|candidate| {
        !is_ignored_context_path(candidate)
            && PROJECT_MARKERS
                .iter()
                .any(|marker| candidate.join(marker).exists())
    })
}

/// 清理命令行路径参数两侧的引号和分隔符。
fn clean_path_argument(part: &str) -> &str {
    part.trim_matches(|character| {
        matches!(
            character,
            '"' | '\'' | ',' | ';' | '(' | ')' | '[' | ']' | '{' | '}'
        )
    })
}

/// 判断路径是否明显不应作为项目目录。
fn is_ignored_context_path(path: &Path) -> bool {
    let lower = path.to_string_lossy().to_ascii_lowercase();
    if lower.is_empty() {
        return false;
    }

    lower == "/"
        || lower.starts_with("/applications/")
        || lower.starts_with("/system/")
        || lower.starts_with("/usr/")
        || lower.starts_with("/library/")
        || lower.contains("/library/application support/")
}

/// 跨技术栈的项目标记文件。
const PROJECT_MARKERS: &[&str] = &[
    "package.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "bun.lockb",
    "vite.config.ts",
    "vite.config.js",
    "next.config.js",
    "next.config.mjs",
    "Cargo.toml",
    "pom.xml",
    "build.gradle",
    "build.gradle.kts",
    "settings.gradle",
    "pyproject.toml",
    "requirements.txt",
    "go.mod",
    "docker-compose.yml",
    "compose.yml",
];
