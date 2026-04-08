//! 7. 用户修正学习：读取、保存并应用 portbeacon-rules.json 本地用户规则。

use std::fs;
use std::path::PathBuf;
use std::sync::{Mutex, OnceLock};

use tauri::{AppHandle, Manager};

use crate::modules::analysis::context::owner_evidence;
use crate::modules::analysis::model::{ProcessEvidence, UserFeedbackRule};
use crate::modules::port::model::PortClassificationVO;

const DEFAULT_FEEDBACK_RULES: &str = include_str!("portbeacon-rules.default.json");

static FEEDBACK_RULES_PATH: OnceLock<PathBuf> = OnceLock::new();
static FEEDBACK_RULES_CACHE: OnceLock<Mutex<Vec<UserFeedbackRule>>> = OnceLock::new();

/// 初始化用户修正规则文件。
pub fn init_feedback_rules(app: AppHandle) -> Result<(), String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("failed to resolve app data directory: {error}"))?;
    fs::create_dir_all(&data_dir)
        .map_err(|error| format!("failed to create app data directory: {error}"))?;

    let rules_path = data_dir.join("portbeacon-rules.json");
    if !rules_path.exists() {
        fs::write(&rules_path, DEFAULT_FEEDBACK_RULES)
            .map_err(|error| format!("failed to create feedback rules file: {error}"))?;
    }

    let _ = FEEDBACK_RULES_PATH.set(rules_path);
    let rules = read_feedback_rules_from_disk()?;
    let _ = FEEDBACK_RULES_CACHE.set(Mutex::new(rules));

    Ok(())
}

/// 应用用户修正规则。用户规则优先于系统推断结果。
pub(crate) fn apply_feedback_override(
    classification: PortClassificationVO,
    port: u16,
    owner_name: &str,
    owner_location: &str,
    chain: &[ProcessEvidence],
) -> PortClassificationVO {
    let owner = owner_evidence(owner_name, owner_location, chain);
    let rules = feedback_rules();

    if let Some(rule) = rules
        .iter()
        .find(|rule| rule.enabled && matches_feedback_rule(rule, port, &owner))
    {
        return PortClassificationVO {
            category: rule.category.clone(),
            visibility: rule.visibility.clone(),
            collapsed_reason: rule.reason.clone(),
        };
    }

    classification
}

/// 返回当前用户修正规则；每次从磁盘重载，支持外部编辑后热生效。
pub fn list_feedback_rules() -> Result<Vec<UserFeedbackRule>, String> {
    reload_feedback_rules()
}

/// 新增或更新用户修正规则，并写回本地 JSON 文件。
pub fn save_feedback_rule(rule: UserFeedbackRule) -> Result<Vec<UserFeedbackRule>, String> {
    let mut rules = reload_feedback_rules()?;
    if let Some(index) = rules.iter().position(|item| item.id == rule.id) {
        rules[index] = rule;
    } else {
        rules.push(rule);
    }
    write_feedback_rules_to_disk(&rules)?;
    replace_feedback_rules_cache(rules.clone());
    Ok(rules)
}

/// 删除用户修正规则，并写回本地 JSON 文件。
pub fn delete_feedback_rule(id: &str) -> Result<Vec<UserFeedbackRule>, String> {
    let mut rules = reload_feedback_rules()?;
    rules.retain(|rule| rule.id != id);
    write_feedback_rules_to_disk(&rules)?;
    replace_feedback_rules_cache(rules.clone());
    Ok(rules)
}

/// 读取当前缓存中的用户规则。
fn feedback_rules() -> Vec<UserFeedbackRule> {
    reload_feedback_rules().unwrap_or_else(|_| {
        FEEDBACK_RULES_CACHE
            .get()
            .and_then(|cache| cache.lock().ok().map(|rules| rules.clone()))
            .unwrap_or_default()
    })
}

/// 从磁盘重载规则并刷新缓存。
fn reload_feedback_rules() -> Result<Vec<UserFeedbackRule>, String> {
    let rules = read_feedback_rules_from_disk()?;
    replace_feedback_rules_cache(rules.clone());
    Ok(rules)
}

/// 替换内存规则缓存。
fn replace_feedback_rules_cache(rules: Vec<UserFeedbackRule>) {
    if let Some(cache) = FEEDBACK_RULES_CACHE.get() {
        if let Ok(mut cache) = cache.lock() {
            *cache = rules;
        }
    } else {
        let _ = FEEDBACK_RULES_CACHE.set(Mutex::new(rules));
    }
}

/// 从本地 JSON 文件读取用户规则。
fn read_feedback_rules_from_disk() -> Result<Vec<UserFeedbackRule>, String> {
    let Some(path) = FEEDBACK_RULES_PATH.get() else {
        return Ok(Vec::new());
    };

    let content = fs::read_to_string(path)
        .map_err(|error| format!("failed to read feedback rules file: {error}"))?;
    serde_json::from_str(&content)
        .map_err(|error| format!("failed to parse feedback rules file: {error}"))
}

/// 将用户规则写入本地 JSON 文件。
fn write_feedback_rules_to_disk(rules: &[UserFeedbackRule]) -> Result<(), String> {
    let Some(path) = FEEDBACK_RULES_PATH.get() else {
        return Err("feedback rules path is not initialized".to_string());
    };

    let content = serde_json::to_string_pretty(rules)
        .map_err(|error| format!("failed to serialize feedback rules file: {error}"))?;
    fs::write(path, content)
        .map_err(|error| format!("failed to write feedback rules file: {error}"))
}

/// 判断用户规则是否命中当前 owner。
fn matches_feedback_rule(rule: &UserFeedbackRule, port: u16, owner: &ProcessEvidence) -> bool {
    if let Some(ports) = &rule.matcher.ports {
        if !ports.contains(&port) {
            return false;
        }
    }

    contains_all(&rule.matcher.process_name_includes, &owner.name)
        && contains_all(
            &rule.matcher.command_includes,
            owner.command.as_deref().unwrap_or_default(),
        )
        && contains_all(
            &rule.matcher.executable_includes,
            owner.executable.as_deref().unwrap_or_default(),
        )
        && contains_all(
            &rule.matcher.cwd_includes,
            owner.cwd.as_deref().unwrap_or_default(),
        )
}

/// 如果设置了 includes，则要求目标文本至少命中其中一个关键词。
fn contains_all(includes: &Option<Vec<String>>, target: &str) -> bool {
    let Some(includes) = includes else {
        return true;
    };

    if includes.is_empty() {
        return true;
    }

    let target = target.to_ascii_lowercase();
    includes
        .iter()
        .map(|item| item.to_ascii_lowercase())
        .any(|item| target.contains(&item))
}
