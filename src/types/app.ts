import type { LucideIcon } from "lucide-react";

import { messages } from "@/lib/i18n";

export type View = "ports" | "history" | "settings" | "help";
export type ServiceStatus = "active";
export type PortScope = "development" | "all";
export type HistoryAction = "detected" | "released" | "replaced" | "stopped" | "ignored" | "failed";
export type HistorySource = "manual" | "monitor" | "policy" | "system";
export type HistoryResult = "success" | "failed" | "pending";

/** 进程树节点视图对象，返回给前端详情抽屉展示。 */
export type ProcessTreeNodeVO = {
  /** 节点进程 PID。 */
  pid: number;
  /** 父进程 PID。 */
  parentPid: number | null;
  /** 进程名称。 */
  name: string;
  /** 进程命令行。 */
  command: string | null;
  /** 进程可执行文件路径。 */
  executable: string | null;
  /** 进程工作目录。 */
  cwd: string | null;
  /** 子进程节点。 */
  children: ProcessTreeNodeVO[];
};

/** 端口服务视图对象，返回给前端展示。 */
export type PortServiceVO = {
  /** 端口记录唯一 ID。 */
  id: string;
  /** 端口号。 */
  port: number;
  /** 端口协议。 */
  protocol: string;
  /** 端口所属进程 PID。 */
  pid: number;
  /** 原始进程名称。 */
  name: string;
  /** 端口状态。 */
  status: ServiceStatus;
  /** 进程运行时长。 */
  uptime: string;
  /** 进程可执行文件路径。 */
  location: string;
  /** CPU 使用率展示值。 */
  cpu: string;
  /** 内存占用展示值。 */
  memory: string;
  /** 数据更新时间展示值。 */
  updatedAt: string;
  /** 端口来源归因信息。 */
  attribution: PortAttributionVO;
  /** 端口分类和可见性信息。 */
  classification: PortClassificationVO;
};

/** 端口来源归因视图对象，返回给前端展示。 */
export type PortAttributionVO = {
  /** 列表和详情中展示的服务名。 */
  displayName: string;
  /** 中文归因摘要。 */
  summary: string;
  /** 英文归因摘要。 */
  summaryEn: string;
  /** 识别到的直接来源应用，例如 IntelliJ IDEA、Codex。 */
  sourceApp: string | null;
  /** 来源类型，例如 ai-agent、ai-ide、ide、terminal。 */
  sourceType: string;
  /** 启动命令或启动器，例如 pnpm dev、Gradle。 */
  launcher: string | null;
  /** 运行时类型，例如 Node.js、Java、Python。 */
  runtime: string | null;
  /** 框架类型，例如 Next.js、Vite、Spring Boot。 */
  framework: string | null;
  /** 推断出的项目名称。 */
  project: string | null;
  /** 归因置信度。 */
  confidence: "high" | "medium" | "low";
  /** 归因打分总分。 */
  scoreTotal: number;
  /** 归因打分原因列表。 */
  scoreReasons: string[];
  /** 命中的证据类型列表。 */
  evidence: string[];
  /** 简化后的进程链标签。 */
  chain: string[];
};

/** 端口分类视图对象，返回给前端用于列表筛选。 */
export type PortClassificationVO = {
  /** 分类标识，例如 dev-server、system-service、ide-background。 */
  category: string;
  /** 可见性，focused 表示进入开发端口视图，collapsed 表示默认折叠但仍在全部端口中展示。 */
  visibility: "focused" | "collapsed";
  /** 默认折叠时的原因说明。 */
  collapsedReason: string | null;
};

/** 用户归因修正规则，来自后端 portbeacon-rules.json。 */
export type UserFeedbackRuleVO = {
  /** 规则 ID。 */
  id: string;
  /** 规则名称。 */
  name: string;
  /** 是否启用。 */
  enabled: boolean;
  /** 匹配条件。 */
  matcher: UserFeedbackMatcherVO;
  /** 覆盖后的分类。 */
  category: string;
  /** 覆盖后的默认可见性。 */
  visibility: "focused" | "collapsed";
  /** 覆盖原因。 */
  reason: string | null;
};

/** 用户归因修正规则匹配条件。 */
export type UserFeedbackMatcherVO = {
  /** 匹配端口号。 */
  ports?: number[] | null;
  /** 匹配 owner 进程名。 */
  processNameIncludes?: string[] | null;
  /** 匹配命令行。 */
  commandIncludes?: string[] | null;
  /** 匹配可执行路径。 */
  executableIncludes?: string[] | null;
  /** 匹配工作目录。 */
  cwdIncludes?: string[] | null;
};

/** 历史事件视图对象，返回给前端展示。 */
export type HistoryEventVO = {
  /** 历史事件 ID。 */
  id: string;
  /** 事件发生时间戳，毫秒。 */
  timestamp: number;
  /** 事件端口号。 */
  port: number;
  /** 端口协议。 */
  protocol: string;
  /** 关联进程 PID。 */
  pid: number | null;
  /** 进程名称。 */
  processName: string;
  /** 事件动作。 */
  action: HistoryAction;
  /** 事件来源。 */
  source: HistorySource;
  /** 执行结果。 */
  result: HistoryResult;
  /** 进程可执行文件路径。 */
  location: string;
  /** 事件原因说明。 */
  reason: string | null;
  /** 错误信息。 */
  error: string | null;
};

/** 导航菜单项。 */
export type NavItem = {
  /** 菜单对应的视图 ID。 */
  id: View;
  /** 菜单图标。 */
  icon: LucideIcon;
};

export type AppCopy = (typeof messages)[keyof typeof messages];
