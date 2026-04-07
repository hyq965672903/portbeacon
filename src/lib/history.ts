import { invoke } from "@tauri-apps/api/core";

import type { HistoryAction, HistoryEntry } from "@/types/app";

export type HistoryListRequest = {
  action?: "all" | HistoryAction;
  limit?: number;
  port?: number;
  range?: string;
  search?: string;
};

export function listHistory(request: HistoryListRequest) {
  return invoke<HistoryEntry[]>("list_history", { request });
}
