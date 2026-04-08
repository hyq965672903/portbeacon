use serde::{Deserialize, Serialize};

/// 端口列表查询对象，由前端传入后端。
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PortListQO {
    /// 搜索关键词，支持端口、PID、服务名、路径和归因字段。
    pub search: Option<String>,
    /// 列表范围，development 表示开发端口，all 表示全部端口。
    pub scope: Option<String>,
    /// 是否只展示用户关注的端口。
    pub pinned_only: Option<bool>,
    /// 用户关注的端口号列表，仅用于本次查询过滤。
    pub pinned_ports: Option<Vec<u16>>,
}

/// 停止进程查询对象，由前端传入后端。
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KillProcessQO {
    /// 目标进程 PID。
    pub pid: u32,
    /// 目标端口号。
    pub port: u16,
    /// 端口协议，例如 tcp 或 udp。
    pub protocol: Option<String>,
}

/// 端口监控配置查询对象，由前端传入后端。
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PortMonitorConfigQO {
    /// 后台端口采集间隔，单位为秒。
    pub interval_seconds: u64,
}

/// 端口分析配置查询对象，由前端传入后端。
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PortAnalysisConfigQO {
    /// 是否启用主动服务指纹探测。
    pub active_fingerprint_enabled: bool,
}

/// 端口扫描快照，供后端内部比对和构建 VO 使用。
#[derive(Clone, Debug)]
pub struct PortSnapshot {
    /// 快照唯一键。
    pub key: String,
    /// 端口号。
    pub port: u16,
    /// 端口协议。
    pub protocol: String,
    /// 端口所属进程 PID。
    pub pid: u32,
    /// 进程名称。
    pub process_name: String,
    /// 进程可执行文件路径。
    pub location: String,
}

/// 进程快照，供后端内部写入手动停止历史使用。
#[derive(Debug)]
pub struct ProcessSnapshot {
    /// 进程 PID。
    pub pid: u32,
    /// 进程名称。
    pub name: String,
    /// 进程可执行文件路径。
    pub location: String,
}

impl ProcessSnapshot {
    /// 在目标进程详情不可用时构造兜底进程快照。
    pub fn fallback(pid: u32) -> Self {
        Self {
            pid,
            name: "Unknown process".to_string(),
            location: "-".to_string(),
        }
    }
}

/// 端口服务视图对象，返回给前端展示。
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PortServiceVO {
    /// 端口记录唯一 ID。
    pub id: String,
    /// 端口号。
    pub port: u16,
    /// 端口协议。
    pub protocol: String,
    /// 端口所属进程 PID。
    pub pid: u32,
    /// 原始进程名称。
    pub name: String,
    /// 端口状态。
    pub status: String,
    /// 进程运行时长。
    pub uptime: String,
    /// 进程可执行文件路径。
    pub location: String,
    /// CPU 使用率展示值。
    pub cpu: String,
    /// 内存占用展示值。
    pub memory: String,
    /// 数据更新时间展示值。
    pub updated_at: String,
    /// 端口来源归因信息。
    pub attribution: PortAttributionVO,
    /// 端口分类和可见性信息。
    pub classification: PortClassificationVO,
}

/// 端口来源归因视图对象，返回给前端展示。
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PortAttributionVO {
    /// 列表和详情中展示的服务名。
    pub display_name: String,
    /// 中文归因摘要。
    pub summary: String,
    /// 英文归因摘要。
    pub summary_en: String,
    /// 识别到的直接来源应用，例如 IntelliJ IDEA、Codex。
    pub source_app: Option<String>,
    /// 来源类型，例如 ai-agent、ai-ide、ide、terminal。
    pub source_type: String,
    /// 启动命令或启动器，例如 pnpm dev、Gradle。
    pub launcher: Option<String>,
    /// 运行时类型，例如 Node.js、Java、Python。
    pub runtime: Option<String>,
    /// 框架类型，例如 Next.js、Vite、Spring Boot。
    pub framework: Option<String>,
    /// 推断出的项目名称。
    pub project: Option<String>,
    /// 归因置信度，high、medium 或 low。
    pub confidence: String,
    /// 归因打分总分。
    pub score_total: i32,
    /// 归因打分原因列表。
    pub score_reasons: Vec<String>,
    /// 命中的证据类型列表。
    pub evidence: Vec<String>,
    /// 简化后的进程链标签。
    pub chain: Vec<String>,
}

/// 端口分类视图对象，返回给前端用于列表筛选。
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PortClassificationVO {
    /// 分类标识，例如 dev-server、system-service、ide-background。
    pub category: String,
    /// 可见性，focused 表示进入开发端口视图，collapsed 表示默认折叠但仍在全部端口中展示。
    pub visibility: String,
    /// 默认折叠时的原因说明。
    pub collapsed_reason: Option<String>,
}

/// 进程树节点视图对象，返回给前端详情抽屉展示。
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessTreeNodeVO {
    /// 节点进程 PID。
    pid: u32,
    /// 父进程 PID。
    parent_pid: Option<u32>,
    /// 进程名称。
    name: String,
    /// 进程命令行。
    command: Option<String>,
    /// 进程可执行文件路径。
    executable: Option<String>,
    /// 进程工作目录。
    cwd: Option<String>,
    /// 子进程节点。
    children: Vec<ProcessTreeNodeVO>,
}

impl ProcessTreeNodeVO {
    pub fn new(
        pid: u32,
        parent_pid: Option<u32>,
        name: String,
        command: Option<String>,
        executable: Option<String>,
        cwd: Option<String>,
    ) -> Self {
        Self {
            pid,
            parent_pid,
            name,
            command,
            executable,
            cwd,
            children: Vec::new(),
        }
    }

    pub fn push_child(&mut self, child: ProcessTreeNodeVO) {
        self.children.push(child);
    }
}

/// 端口列表分页视图对象，返回给前端展示。
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PortListVO {
    /// 当前筛选条件下的端口记录。
    pub items: Vec<PortServiceVO>,
    /// 过滤后的总记录数。
    pub total: usize,
}
