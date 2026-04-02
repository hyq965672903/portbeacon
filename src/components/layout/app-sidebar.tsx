import { SquareTerminal } from "lucide-react";

import { AppCopy, NavItem, View } from "@/types/app";
import { cn } from "@/lib/utils";

type SidebarSectionProps = {
  title: string;
  items: NavItem[];
  currentView: View;
  onChangeView: (view: View) => void;
  labels: AppCopy["nav"];
};

function SidebarSection({ title, items, currentView, onChangeView, labels }: SidebarSectionProps) {
  return (
    <div>
      <p className="mb-2 px-2 text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
        {title}
      </p>
      <div className="space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onChangeView(item.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
              currentView === item.id
                ? "bg-[var(--secondary)] text-[var(--foreground)] shadow-[inset_0_0_0_1px_var(--border)]"
                : "text-[var(--muted-foreground)] hover:bg-white/[0.03] hover:text-[var(--foreground)]",
            )}
          >
            <item.icon className="size-4" />
            <span>{labels[item.id]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

type AppSidebarProps = {
  copy: AppCopy;
  locale: "zh" | "en";
  currentView: View;
  navItems: NavItem[];
  onChangeView: (view: View) => void;
};

export function AppSidebar({
  copy,
  locale,
  currentView,
  navItems,
  onChangeView,
}: AppSidebarProps) {
  return (
    <aside className="flex h-full min-h-0 w-full flex-col overflow-auto rounded-[28px] border border-[var(--border)] bg-[var(--sidebar)] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.25)] backdrop-blur">
      <div className="mb-5 flex items-center gap-3 px-2">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)]/12 text-[var(--primary)] shadow-[inset_0_0_0_1px_rgba(19,217,196,0.22)]">
          <SquareTerminal className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{copy.brand.title}</p>
        </div>
      </div>

      <nav className="space-y-5">
        <SidebarSection
          title={locale === "zh" ? "核心" : "Core"}
          items={[navItems[0]]}
          currentView={currentView}
          onChangeView={onChangeView}
          labels={copy.nav}
        />
        <SidebarSection
          title={locale === "zh" ? "数据" : "Data"}
          items={[navItems[1]]}
          currentView={currentView}
          onChangeView={onChangeView}
          labels={copy.nav}
        />
        <SidebarSection
          title={locale === "zh" ? "系统" : "System"}
          items={[navItems[2], navItems[3]]}
          currentView={currentView}
          onChangeView={onChangeView}
          labels={copy.nav}
        />
      </nav>

    </aside>
  );
}
