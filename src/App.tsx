import { useEffect, useMemo, useState } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { HelpView } from "@/components/views/help-view";
import { HistoryView } from "@/components/views/history-view";
import { PortsView } from "@/components/views/ports-view";
import { SettingsView } from "@/components/views/settings-view";
import { historyEntries, navItems, services } from "@/data/mock";
import { Locale, messages, ThemeMode } from "@/lib/i18n";
import { View } from "@/types/app";

function App() {
  const [view, setView] = useState<View>("ports");
  const [locale, setLocale] = useState<Locale>("zh");
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = useState<Exclude<ThemeMode, "system">>("dark");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [portFilter, setPortFilter] = useState("all");
  const [rangeFilter, setRangeFilter] = useState("24h");
  const [historySearch, setHistorySearch] = useState("");
  const [portsSearch, setPortsSearch] = useState("");
  const [serviceStatusFilter, setServiceStatusFilter] = useState<"all" | "active" | "warning" | "stopped">("all");
  const [autoKill, setAutoKill] = useState(true);
  const [strictMode, setStrictMode] = useState(false);

  const copy = messages[locale];

  useEffect(() => {
    const storedLocale = window.localStorage.getItem("portbeacon-locale");
    const storedTheme = window.localStorage.getItem("portbeacon-theme-mode");

    if (storedLocale === "zh" || storedLocale === "en") {
      setLocale(storedLocale);
    }

    if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
      setThemeMode(storedTheme);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("portbeacon-locale", locale);
  }, [locale]);

  useEffect(() => {
    window.localStorage.setItem("portbeacon-theme-mode", themeMode);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncTheme = () => {
      const nextTheme = themeMode === "system" ? (media.matches ? "dark" : "light") : themeMode;
      setResolvedTheme(nextTheme);
      document.documentElement.dataset.theme = nextTheme;
    };

    syncTheme();
    media.addEventListener("change", syncTheme);

    return () => media.removeEventListener("change", syncTheme);
  }, [themeMode]);

  const filteredHistory = useMemo(() => {
    return historyEntries.filter((entry) => {
      const matchesAction = historyFilter === "all" || entry.action === historyFilter;
      const matchesPort = portFilter === "all" || String(entry.port) === portFilter;
      const keyword = historySearch.trim().toLowerCase();
      const matchesKeyword =
        !keyword ||
        `${entry.location} ${entry.executor} ${entry.port} ${entry.pid}`.toLowerCase().includes(keyword);

      return matchesAction && matchesPort && matchesKeyword;
    });
  }, [historyFilter, portFilter, historySearch]);

  return (
    <div className="h-screen overflow-hidden bg-transparent text-[var(--foreground)]">
      <div className="mx-auto grid h-full max-w-[1760px] grid-cols-[minmax(220px,2fr)_minmax(0,8fr)] gap-4 overflow-hidden px-3 py-3 md:px-5 md:py-5">
        <AppSidebar
          copy={copy}
          locale={locale}
          currentView={view}
          navItems={navItems}
          onChangeView={setView}
        />

        <main className="grid min-h-0 min-w-0 grid-rows-[minmax(120px,1fr)_minmax(0,9fr)] gap-4 overflow-hidden">
          <WorkspaceHeader
            copy={copy}
            locale={locale}
            onLocaleChange={setLocale}
            themeMode={themeMode}
            resolvedTheme={resolvedTheme}
            onThemeChange={setThemeMode}
          />

          <div className="min-h-0 flex flex-col overflow-hidden rounded-[32px] border border-[var(--border)] bg-[var(--panel)] px-4 py-5 shadow-[0_40px_100px_rgba(0,0,0,0.2)] backdrop-blur-xl md:p-8">
            {view === "ports" && (
              <PortsView
                copy={copy}
                services={services}
                search={portsSearch}
                statusFilter={serviceStatusFilter}
                onSearchChange={setPortsSearch}
                onStatusFilterChange={setServiceStatusFilter}
              />
            )}
            {view === "history" && (
              <HistoryView
                copy={copy}
                entries={filteredHistory}
                historyFilter={historyFilter}
                portFilter={portFilter}
                rangeFilter={rangeFilter}
                search={historySearch}
                onHistoryFilterChange={setHistoryFilter}
                onPortFilterChange={setPortFilter}
                onRangeFilterChange={setRangeFilter}
                onSearchChange={setHistorySearch}
              />
            )}
            {view === "settings" && (
              <SettingsView
                copy={copy}
                autoKill={autoKill}
                strictMode={strictMode}
                onAutoKillChange={setAutoKill}
                onStrictModeChange={setStrictMode}
              />
            )}
            {view === "help" && <HelpView copy={copy} />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
