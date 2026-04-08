import { invoke } from "@tauri-apps/api/core";

import type { ProcessTreeNode, Service } from "@/types/app";
import type { PortScope } from "@/types/app";

export type PortListResponse = {
  items: Service[];
  total: number;
  page: number;
  pageSize: number;
};

export type PortListRequest = {
  page: number;
  pageSize: number;
  search: string;
  scope: PortScope;
  pinnedOnly: boolean;
  pinnedPorts: number[];
};

export type KillProcessRequest = {
  pid: number;
  port: number;
  protocol?: string;
};

export function listPorts(request: PortListRequest) {
  return invoke<PortListResponse>("list_ports", { request });
}

export function getProcessTree(pid: number) {
  return invoke<ProcessTreeNode | null>("get_process_tree", { pid });
}

export function killProcess(request: KillProcessRequest) {
  return invoke<void>("kill_process", { request });
}
