import type { LucideIcon } from "lucide-react";

import { messages } from "@/lib/i18n";

export type View = "ports" | "history" | "settings" | "help";
export type ServiceStatus = "active";
export type PortScope = "development" | "all";
export type HistoryAction = "detected" | "released" | "replaced" | "stopped" | "ignored" | "failed";
export type HistorySource = "manual" | "monitor" | "policy" | "system";
export type HistoryResult = "success" | "failed" | "pending";

export type ProcessTreeNode = {
  pid: number;
  parentPid: number | null;
  name: string;
  command: string | null;
  executable: string | null;
  cwd: string | null;
  children: ProcessTreeNode[];
};

export type Service = {
  id: string;
  port: number;
  protocol: string;
  pid: number;
  name: string;
  status: ServiceStatus;
  uptime: string;
  location: string;
  cpu: string;
  memory: string;
  updatedAt: string;
  attribution: PortAttribution;
  classification: PortClassification;
};

export type PortAttribution = {
  displayName: string;
  summary: string;
  summaryEn: string;
  sourceApp: string | null;
  sourceType: string;
  launcher: string | null;
  runtime: string | null;
  framework: string | null;
  project: string | null;
  confidence: "high" | "medium" | "low";
  evidence: string[];
  chain: string[];
};

export type PortClassification = {
  category: string;
  visibility: "focused" | "hidden";
  hiddenReason: string | null;
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
