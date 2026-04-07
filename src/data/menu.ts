import { AppWindow, HelpCircle, History, Settings } from "lucide-react";

import { NavItem } from "@/types/app";

export const navItems: NavItem[] = [
  { id: "ports", icon: AppWindow },
  { id: "history", icon: History },
  { id: "settings", icon: Settings },
  { id: "help", icon: HelpCircle },
];
