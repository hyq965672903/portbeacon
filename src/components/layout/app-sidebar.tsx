import { SquareTerminal } from "lucide-react";

import { AppCopy, NavItem, View } from "@/types/app";
import { cn } from "@/lib/utils";

type SidebarSectionProps = {
  items: NavItem[];
  currentView: View;
  onChangeView: (view: View) => void;
  labels: AppCopy["nav"];
};

function SidebarSection({ items, currentView, onChangeView, labels }: SidebarSectionProps) {
  return (
    <div className="space-y-1.5">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChangeView(item.id)}
          className={cn(
            "group relative flex w-full items-center gap-2.5 overflow-hidden rounded-lg px-2.5 py-2 text-left text-sm transition-all duration-200 hover:translate-x-0.5",
            currentView === item.id
              ? "bg-[var(--secondary)] text-[var(--foreground)] shadow-[inset_0_0_0_1px_var(--border)]"
              : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)]/55 hover:text-[var(--foreground)]",
          )}
        >
          <span
            className={cn(
              "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[var(--primary)] transition-opacity",
              currentView === item.id ? "opacity-100" : "opacity-0",
            )}
          />
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-md transition-colors",
              currentView === item.id
                ? "bg-[var(--primary)]/14 text-[var(--primary)]"
                : "bg-transparent text-[var(--muted-foreground)] group-hover:bg-[var(--primary)]/10 group-hover:text-[var(--primary)]",
            )}
          >
            <item.icon className="size-4" />
          </span>
          <span className="truncate">{labels[item.id]}</span>
        </button>
      ))}
    </div>
  );
}

type AppSidebarProps = {
  copy: AppCopy;
  currentView: View;
  navItems: NavItem[];
  onChangeView: (view: View) => void;
};

export function AppSidebar({
  copy,
  currentView,
  navItems,
  onChangeView,
}: AppSidebarProps) {
  return (
    <aside className="flex h-full min-h-0 w-full flex-col overflow-auto rounded-lg border border-[var(--border)] bg-[var(--sidebar)] p-2.5 shadow-[0_28px_72px_rgba(0,0,0,0.25)] backdrop-blur">
      <div className="mb-3 flex items-center gap-2 px-1.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/12 text-[var(--primary)] shadow-[inset_0_0_0_1px_rgba(19,217,196,0.22)]">
          <SquareTerminal className="size-4.5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold">{copy.brand.title}</p>
          <p className="truncate text-[11px] text-[var(--muted-foreground)]">{copy.brand.subtitle}</p>
        </div>
      </div>

      <nav className="space-y-1.5">
        <SidebarSection
          items={navItems}
          currentView={currentView}
          onChangeView={onChangeView}
          labels={copy.nav}
        />
      </nav>

    </aside>
  );
}
