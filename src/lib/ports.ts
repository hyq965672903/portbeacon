import { invoke } from "@tauri-apps/api/core";

import { Service } from "@/types/app";

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
};

export function listPorts(request: PortListRequest) {
  return invoke<PortListResponse>("list_ports", { request });
}
