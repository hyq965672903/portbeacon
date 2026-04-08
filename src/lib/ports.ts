import { invoke } from "@tauri-apps/api/core";

import type { ProcessTreeNodeVO, PortServiceVO } from "@/types/app";
import type { PortScope } from "@/types/app";

/** 端口列表分页视图对象，来自后端 list_ports。 */
export type PortListVO = {
  /** 当前页端口记录。 */
  items: PortServiceVO[];
  /** 过滤后的总记录数。 */
  total: number;
  /** 当前页码。 */
  page: number;
  /** 每页记录数。 */
  pageSize: number;
};

/** 端口列表查询对象，传给后端 list_ports。 */
export type PortListQO = {
  /** 当前页码，从 1 开始。 */
  page: number;
  /** 每页记录数。 */
  pageSize: number;
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

export function listPorts(request: PortListQO) {
  return invoke<PortListVO>("list_ports", { request });
}

export function getProcessTree(pid: number) {
  return invoke<ProcessTreeNodeVO | null>("get_process_tree", { pid });
}

export function killProcess(request: KillProcessQO) {
  return invoke<void>("kill_process", { request });
}
