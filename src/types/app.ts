import type { LucideIcon } from "lucide-react";

import { messages } from "@/lib/i18n";

export type View = "ports" | "history" | "settings" | "help";
export type ServiceStatus = "active";
export type HistoryAction = "detected" | "released" | "replaced" | "stopped" | "ignored" | "failed";
export type HistorySource = "manual" | "monitor" | "policy" | "system";
export type HistoryResult = "success" | "failed" | "pending";

export type ProcessTreeNode = {
  pid: number;
  parentPid: number | null;
  name: string;
  command: string | null;
  executable: string | null;
  children: ProcessTreeNode[];
};

export type Service = {
  id: string;
  port: number;
  pid: number;
  name: string;
  status: ServiceStatus;
  uptime: string;
  location: string;
  cpu: string;
  memory: string;
  updatedAt: string;
};

export type HistoryEntry = {
  id: string;
  timestamp: number;
  port: number;
  protocol: string;
  pid: number | null;
  processName: string;
  action: HistoryAction;
  source: HistorySource;
  result: HistoryResult;
  location: string;
  reason: string | null;
  error: string | null;
};

export type NavItem = {
  id: View;
  icon: LucideIcon;
};

export type AppCopy = (typeof messages)[keyof typeof messages];
