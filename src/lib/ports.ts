import { invoke } from "@tauri-apps/api/core";

import type { ProcessTreeNodeVO, PortServiceVO, UserFeedbackRuleVO } from "@/types/app";
import type { PortScope } from "@/types/app";

/** 端口列表视图对象，来自后端 list_ports。 */
export type PortListVO = {
  /** 当前筛选条件下的端口记录。 */
  items: PortServiceVO[];
  /** 过滤后的总记录数。 */
  total: number;
};

/** 端口列表查询对象，传给后端 list_ports。 */
export type PortListQO = {
  /** 搜索关键词。 */
  search: string;
  /** 列表范围。 */
  scope: PortScope;
  /** 是否只展示用户关注的端口。 */
  pinnedOnly: boolean;
  /** 用户关注的端口号列表。 */
  pinnedPorts: number[];
};

/** 停止进程查询对象，传给后端 kill_process。 */
export type KillProcessQO = {
  /** 目标进程 PID。 */
  pid: number;
  /** 目标端口号。 */
  port: number;
  /** 端口协议。 */
  protocol?: string;
};

/** 端口监控配置查询对象，传给后端 set_port_monitor_config。 */
export type PortMonitorConfigQO = {
  /** 后台端口采集间隔，单位为秒。 */
  intervalSeconds: number;
};

/** 端口分析配置查询对象，传给后端 set_port_analysis_config。 */
export type PortAnalysisConfigQO = {
  /** 是否启用主动服务指纹探测。 */
  activeFingerprintEnabled: boolean;
};

export function listPorts(request: PortListQO) {
  return invoke<PortListVO>("list_ports", { request });
}

export function getProcessTree(pid: number) {
  return invoke<ProcessTreeNodeVO | null>("get_process_tree", { pid });
}

export function killProcess(request: KillProcessQO) {
  return invoke<void>("kill_process", { request });
}

export function setPortMonitorConfig(request: PortMonitorConfigQO) {
  return invoke<void>("set_port_monitor_config", { request });
}

export function setPortAnalysisConfig(request: PortAnalysisConfigQO) {
  return invoke<void>("set_port_analysis_config", { request });
}

export function listPortRules() {
  return invoke<UserFeedbackRuleVO[]>("list_port_rules");
}

export function savePortRule(rule: UserFeedbackRuleVO) {
  return invoke<UserFeedbackRuleVO[]>("save_port_rule", { rule });
}

export function deletePortRule(id: string) {
  return invoke<UserFeedbackRuleVO[]>("delete_port_rule", { id });
}
