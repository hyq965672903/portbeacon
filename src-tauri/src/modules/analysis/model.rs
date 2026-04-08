//! 0. 分析模型：定义分析引擎内部使用的进程证据、来源类型、评分和用户规则，不直接参与执行流程。

use serde::{Deserialize, Serialize};

/// 归因引擎使用的进程证据。
#[derive(Clone, Debug)]
pub struct ProcessEvidence {
    /// 进程名称。
    pub name: String,
    /// 进程命令行。
    pub command: Option<String>,
    /// 进程可执行文件路径。
    pub executable: Option<String>,
    /// 进程工作目录。
    pub cwd: Option<String>,
}

/// 模糊归因时使用的分组证据分数。
#[derive(Clone, Debug, Default)]
pub(crate) struct AttributionScore {
    /// 监听进程 owner 是否像服务进程。
    pub owner: i32,
    /// 来源进程是否像开发工具、AI 工具或终端。
    pub source: i32,
    /// 是否存在项目目录或项目文件上下文。
    pub project: i32,
    /// 是否命中框架、启动器或服务指纹。
    pub service: i32,
    /// 内部后台、系统目录等负向证据。
    pub internal: i32,
    /// 可解释的分数来源。
    pub reasons: Vec<String>,
}

impl AttributionScore {
    /// 汇总所有分组分数。
    pub(crate) fn total(&self) -> i32 {
        self.owner + self.source + self.project + self.service + self.internal
    }
}

/// 从进程链中识别出的来源大类。
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) enum SourceKind {
    AiAgent,
    AiIde,
    Ide,
    Terminal,
    Lifestyle,
    Browser,
    System,
}

/// 将进程证据映射为用户可读来源应用的规则。
pub(crate) struct SourceRule {
    /// 用户可读的来源应用名称。
    pub display: &'static str,
    /// 来源应用类型。
    pub kind: SourceKind,
    /// 用于匹配进程名称、命令或可执行路径的关键词。
    pub needles: &'static [&'static str],
}

pub(crate) const SOURCE_RULES: &[SourceRule] = &[
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
        needles: &["claude", "claude-code", "claude code"],
    },
    SourceRule {
        display: "OpenHands",
        kind: SourceKind::AiAgent,
        needles: &["openhands"],
    },
    SourceRule {
        display: "OpenCode",
        kind: SourceKind::AiAgent,
        needles: &["opencode"],
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
        display: "DataGrip",
        kind: SourceKind::Ide,
        needles: &["datagrip"],
    },
    SourceRule {
        display: "CLion",
        kind: SourceKind::Ide,
        needles: &["clion"],
    },
    SourceRule {
        display: "PhpStorm",
        kind: SourceKind::Ide,
        needles: &["phpstorm"],
    },
    SourceRule {
        display: "RustRover",
        kind: SourceKind::Ide,
        needles: &["rustrover"],
    },
    SourceRule {
        display: "Rider",
        kind: SourceKind::Ide,
        needles: &["rider"],
    },
    SourceRule {
        display: "RubyMine",
        kind: SourceKind::Ide,
        needles: &["rubymine"],
    },
    SourceRule {
        display: "Aqua",
        kind: SourceKind::Ide,
        needles: &["aqua.app", "/aqua"],
    },
    SourceRule {
        display: "Fleet",
        kind: SourceKind::Ide,
        needles: &["fleet.app", "/fleet"],
    },
    SourceRule {
        display: "Android Studio",
        kind: SourceKind::Ide,
        needles: &["android studio"],
    },
    SourceRule {
        display: "JetBrains Toolbox",
        kind: SourceKind::Ide,
        needles: &["jetbrains toolbox"],
    },
    SourceRule {
        display: "JetBrains Gateway",
        kind: SourceKind::Ide,
        needles: &["jetbrains gateway", "gateway.app"],
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
        display: "OrbStack",
        kind: SourceKind::Ide,
        needles: &["orbstack"],
    },
    SourceRule {
        display: "Docker",
        kind: SourceKind::Ide,
        needles: &["docker", "com.docker"],
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
        display: "Microsoft Teams",
        kind: SourceKind::Lifestyle,
        needles: &["microsoft teams", "teams.app"],
    },
    SourceRule {
        display: "Discord",
        kind: SourceKind::Lifestyle,
        needles: &["discord"],
    },
    SourceRule {
        display: "Zoom",
        kind: SourceKind::Lifestyle,
        needles: &["zoom"],
    },
    SourceRule {
        display: "Telegram",
        kind: SourceKind::Lifestyle,
        needles: &["telegram"],
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
            "airplayxpchelper",
            "locationd",
        ],
    },
];

/// 用户修正规则，来自 app data 目录下的 portbeacon-rules.json。
#[derive(Clone, Debug, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserFeedbackRule {
    /// 规则 ID。
    pub id: String,
    /// 规则名称。
    pub name: String,
    /// 是否启用。
    pub enabled: bool,
    /// 匹配条件。
    pub matcher: UserFeedbackMatcher,
    /// 覆盖后的分类。
    pub category: String,
    /// 覆盖后的默认可见性，focused 或 collapsed。
    pub visibility: String,
    /// 覆盖原因。
    pub reason: Option<String>,
}

/// 用户修正规则的匹配条件。
#[derive(Clone, Debug, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserFeedbackMatcher {
    /// 匹配端口号。
    pub ports: Option<Vec<u16>>,
    /// 匹配 owner 进程名。
    pub process_name_includes: Option<Vec<String>>,
    /// 匹配命令行。
    pub command_includes: Option<Vec<String>>,
    /// 匹配可执行路径。
    pub executable_includes: Option<Vec<String>>,
    /// 匹配工作目录。
    pub cwd_includes: Option<Vec<String>>,
}
