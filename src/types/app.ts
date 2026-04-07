import type { LucideIcon } from "lucide-react";

import { messages } from "@/lib/i18n";

export type View = "ports" | "history" | "settings" | "help";
export type ServiceStatus = "active";
export type HistoryAction = "stopped" | "started" | "ignored";

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
  timestamp: string;
  port: number;
  pid: number;
  action: HistoryAction;
  executor: string;
  location: string;
};

export type NavItem = {
  id: View;
  icon: LucideIcon;
};

export type AppCopy = (typeof messages)[keyof typeof messages];
