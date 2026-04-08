import { invoke } from "@tauri-apps/api/core";

import type { HistoryAction, HistoryEventVO } from "@/types/app";

/** 历史记录查询对象，传给后端 list_history。 */
export type HistoryListQO = {
  /** 动作类型过滤。 */
  action?: "all" | HistoryAction;
  /** 返回记录上限。 */
  limit?: number;
  /** 指定端口过滤。 */
  port?: number;
  /** 时间范围过滤。 */
  range?: string;
  /** 搜索关键词。 */
  search?: string;
};

export function listHistory(request: HistoryListQO) {
  return invoke<HistoryEventVO[]>("list_history", { request });
}
