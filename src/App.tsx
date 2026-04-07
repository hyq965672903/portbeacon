import { useEffect, useMemo, useState } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { HelpView } from "@/components/views/help-view";
import { HistoryView } from "@/components/views/history-view";
import { PortsView } from "@/components/views/ports-view";
import { SettingsView } from "@/components/views/settings-view";
import { historyEntries } from "@/data/history-data";
import { navItems } from "@/data/menu";
import { useLayoutMode } from "@/hooks/use-layout-mode";
import { Locale, messages, ThemeMode } from "@/lib/i18n";
import { listPorts } from "@/lib/ports";
import { Service, View } from "@/types/app";

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
  const [services, setServices] = useState<Service[]>([]);
  const [portsPage, setPortsPage] = useState(1);
  const [portsTotal, setPortsTotal] = useState(0);
  const [portsLoading, setPortsLoading] = useState(false);
  const [portsError, setPortsError] = useState<string | null>(null);
  const [portsRefreshKey, setPortsRefreshKey] = useState(0);
  const [autoKill, setAutoKill] = useState(true);
  const [strictMode, setStrictMode] = useState(false);

  const copy = messages[locale];
  const layoutMode = useLayoutMode();
  const portsPageSize = layoutMode === "compact" ? 8 : layoutMode === "wide" ? 16 : 12;

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

  useEffect(() => {
    setPortsPage(1);
  }, [portsSearch, portsPageSize]);

  useEffect(() => {
    let cancelled = false;

    setPortsLoading(true);
    const timer = window.setTimeout(() => {
      listPorts({
        page: portsPage,
        pageSize: portsPageSize,
        search: portsSearch,
      })
        .then((response) => {
          if (cancelled) return;
          setServices(response.items);
          setPortsTotal(response.total);
          setPortsError(null);
        })
        .catch((error) => {
          if (cancelled) return;
          setServices([]);
          setPortsTotal(0);
          setPortsError(error instanceof Error ? error.message : String(error));
        })
        .finally(() => {
          if (!cancelled) {
            setPortsLoading(false);
          }
        });
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [portsPage, portsPageSize, portsRefreshKey, portsSearch]);

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
    <div className="portbeacon-app h-screen overflow-hidden bg-transparent text-[var(--foreground)]" data-layout-mode={layoutMode}>
      <div className="portbeacon-shell mx-auto grid h-full overflow-hidden">
        <AppSidebar
          copy={copy}
          currentView={view}
          navItems={navItems}
          onChangeView={setView}
        />

        <main className="portbeacon-main grid min-h-0 min-w-0 overflow-hidden">
          <WorkspaceHeader
            copy={copy}
            locale={locale}
            currentView={view}
            onLocaleChange={setLocale}
            themeMode={themeMode}
            resolvedTheme={resolvedTheme}
            onThemeChange={setThemeMode}
          />

          <div className="portbeacon-content min-h-0 flex flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)] shadow-[0_36px_96px_rgba(0,0,0,0.24)] backdrop-blur-xl">
            {view === "ports" && (
              <PortsView
                copy={copy}
                services={services}
                total={portsTotal}
                page={portsPage}
                pageSize={portsPageSize}
                loading={portsLoading}
                error={portsError}
                search={portsSearch}
                onPageChange={setPortsPage}
                onSearchChange={setPortsSearch}
                onRefresh={() => setPortsRefreshKey((value) => value + 1)}
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
