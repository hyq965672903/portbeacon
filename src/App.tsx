import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { Button } from "@/components/ui/button";
import { HelpView } from "@/components/views/help-view";
import { HistoryView } from "@/components/views/history-view";
import { PortsView } from "@/components/views/ports-view";
import { SettingsView } from "@/components/views/settings-view";
import { navItems } from "@/data/menu";
import { useLayoutMode } from "@/hooks/use-layout-mode";
import { listHistory } from "@/lib/history";
import { Locale, messages, ThemeMode } from "@/lib/i18n";
import { killProcess, listPorts } from "@/lib/ports";
import type { HistoryAction, HistoryEventVO, PortScope, PortServiceVO, View } from "@/types/app";

function App() {
  const [view, setView] = useState<View>("ports");
  const [locale, setLocale] = useState<Locale>("zh");
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = useState<Exclude<ThemeMode, "system">>("dark");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [portFilter, setPortFilter] = useState("all");
  const [rangeFilter, setRangeFilter] = useState("24h");
  const [historySearch, setHistorySearch] = useState("");
  const [historyEntries, setHistoryEntries] = useState<HistoryEventVO[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [portsSearch, setPortsSearch] = useState("");
  const [portScope, setPortScope] = useState<PortScope>("development");
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [pinnedPorts, setPinnedPorts] = useState<number[]>([]);
  const [services, setServices] = useState<PortServiceVO[]>([]);
  const [portsTotal, setPortsTotal] = useState(0);
  const [portsLoading, setPortsLoading] = useState(false);
  const [portsError, setPortsError] = useState<string | null>(null);
  const [portsRefreshKey, setPortsRefreshKey] = useState(0);
  const [portsAutoRefresh, setPortsAutoRefresh] = useState(true);
  const [pendingStopService, setPendingStopService] = useState<PortServiceVO | null>(null);
  const [stopError, setStopError] = useState<string | null>(null);
  const [stoppingPid, setStoppingPid] = useState<number | null>(null);
  const [autoKill, setAutoKill] = useState(true);
  const [strictMode, setStrictMode] = useState(false);

  const copy = messages[locale];
  const layoutMode = useLayoutMode();
  const hasLoadedPortsRef = useRef(false);
  const portsRefreshModeRef = useRef<"visible" | "quiet">("visible");

  useEffect(() => {
    const storedLocale = window.localStorage.getItem("portbeacon-locale");
    const storedTheme = window.localStorage.getItem("portbeacon-theme-mode");
    const storedPinnedPorts = window.localStorage.getItem("portbeacon-pinned-ports");

    if (storedLocale === "zh" || storedLocale === "en") {
      setLocale(storedLocale);
    }

    if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
      setThemeMode(storedTheme);
    }

    if (storedPinnedPorts) {
      try {
        const parsed = JSON.parse(storedPinnedPorts);
        if (Array.isArray(parsed)) {
          setPinnedPorts(parsed.filter((port) => Number.isInteger(port) && port > 0 && port <= 65535));
        }
      } catch {
        setPinnedPorts([]);
      }
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
    if (view === "ports") {
      setPortsAutoRefresh(true);
    }
  }, [view]);

  useEffect(() => {
    window.localStorage.setItem("portbeacon-pinned-ports", JSON.stringify(pinnedPorts));
  }, [pinnedPorts]);

  useEffect(() => {
    let cancelled = false;
    const showLoading = portsRefreshModeRef.current === "visible" || !hasLoadedPortsRef.current;

    if (showLoading) {
      setPortsLoading(true);
    }
    const timer = window.setTimeout(() => {
      listPorts({
        search: portsSearch,
        scope: portScope,
        pinnedOnly,
        pinnedPorts,
      })
        .then((response) => {
          if (cancelled) return;
          setServices(response.items);
          setPortsTotal(response.total);
          setPortsError(null);
        })
        .catch((error) => {
          if (cancelled) return;
          if (showLoading) {
            setServices([]);
            setPortsTotal(0);
            setPortsError(error instanceof Error ? error.message : String(error));
          }
        })
        .finally(() => {
          if (!cancelled) {
            hasLoadedPortsRef.current = true;
            portsRefreshModeRef.current = "visible";
            setPortsLoading(false);
          }
        });
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pinnedOnly, pinnedPorts, portScope, portsRefreshKey, portsSearch]);

  useEffect(() => {
    let cancelled = false;
    setHistoryLoading(true);

    listHistory({
      action: historyFilter === "all" ? "all" : (historyFilter as HistoryAction),
      limit: 300,
      port: portFilter === "all" ? undefined : Number(portFilter),
      range: rangeFilter,
      search: historySearch,
    })
      .then((entries) => {
        if (cancelled) return;
        setHistoryEntries(entries);
        setHistoryError(null);
      })
      .catch((error) => {
        if (cancelled) return;
        setHistoryEntries([]);
        setHistoryError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [historyFilter, historyRefreshKey, historySearch, portFilter, rangeFilter]);

  useEffect(() => {
    const unlistenPromise = listen("history-updated", () => {
      setHistoryRefreshKey((value) => value + 1);
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten()).catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    let refreshTimer: number | undefined;
    const unlistenPromise = listen("ports-updated", () => {
      if (!portsAutoRefresh || view !== "ports") {
        return;
      }

      if (refreshTimer !== undefined) {
        window.clearTimeout(refreshTimer);
      }

      refreshTimer = window.setTimeout(() => {
        requestPortsRefresh("quiet");
      }, 300);
    });

    return () => {
      if (refreshTimer !== undefined) {
        window.clearTimeout(refreshTimer);
      }
      unlistenPromise.then((unlisten) => unlisten()).catch(() => undefined);
    };
  }, [portsAutoRefresh, view]);

  async function handleStopService(service: PortServiceVO) {
    if (stoppingPid !== null || service.pid === 0) {
      return;
    }

    setStopError(null);
    setPendingStopService(service);
  }

  function togglePinnedPort(port: number) {
    setPinnedPorts((current) =>
      current.includes(port)
        ? current.filter((pinnedPort) => pinnedPort !== port)
        : [...current, port].sort((left, right) => left - right),
    );
  }

  function requestPortsRefresh(mode: "visible" | "quiet" = "visible") {
    portsRefreshModeRef.current = mode;
    setPortsRefreshKey((value) => value + 1);
  }

  async function confirmStopService() {
    if (!pendingStopService || stoppingPid !== null || pendingStopService.pid === 0) {
      return;
    }

    setStopError(null);
    setStoppingPid(pendingStopService.pid);

    try {
      await killProcess({
        pid: pendingStopService.pid,
        port: pendingStopService.port,
        protocol: pendingStopService.protocol,
      });
      setPendingStopService(null);
      requestPortsRefresh("visible");
      setHistoryRefreshKey((value) => value + 1);
    } catch (error) {
      setStopError(error instanceof Error ? error.message : String(error));
      setHistoryRefreshKey((value) => value + 1);
    } finally {
      setStoppingPid(null);
    }
  }

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
                locale={locale}
                services={services}
                total={portsTotal}
                loading={portsLoading}
                error={portsError}
                search={portsSearch}
                scope={portScope}
                autoRefresh={portsAutoRefresh}
                pinnedOnly={pinnedOnly}
                pinnedPorts={pinnedPorts}
                stoppingPid={stoppingPid}
                onAutoRefreshChange={setPortsAutoRefresh}
                onPinnedOnlyChange={setPinnedOnly}
                onPinnedPortToggle={togglePinnedPort}
                onSearchChange={setPortsSearch}
                onScopeChange={setPortScope}
                onStopService={handleStopService}
                onRefresh={() => requestPortsRefresh("visible")}
              />
            )}
            {view === "history" && (
              <HistoryView
                copy={copy}
                entries={historyEntries}
                error={historyError}
                historyFilter={historyFilter}
                loading={historyLoading}
                portFilter={portFilter}
                rangeFilter={rangeFilter}
                search={historySearch}
                onHistoryFilterChange={setHistoryFilter}
                onPortFilterChange={setPortFilter}
                onRangeFilterChange={setRangeFilter}
                onRefresh={() => setHistoryRefreshKey((value) => value + 1)}
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

      {pendingStopService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-label={copy.ports.stopTitle}
            className="w-[min(420px,calc(100vw-32px))] rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[0_28px_100px_rgba(0,0,0,0.45)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--destructive)]">
                  {copy.controls.stop}
                </p>
                <h2 className="mt-1 text-lg font-semibold">{copy.ports.stopTitle}</h2>
              </div>
              <div className="rounded-lg bg-[var(--destructive)]/12 px-2.5 py-1 font-mono text-sm text-[var(--destructive)]">
                :{pendingStopService.port}
              </div>
            </div>

            <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
              {copy.ports.stopDescription}
            </p>

            <div className="mt-4 space-y-2 rounded-lg border border-[var(--border)] bg-[var(--card)]/72 p-3 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--muted-foreground)]">{copy.table.service}</span>
                <span className="min-w-0 truncate font-semibold">{pendingStopService.name}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--muted-foreground)]">{copy.table.pid}</span>
                <span className="font-mono">{pendingStopService.pid}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-[var(--muted-foreground)]">{copy.table.path}</span>
                <span className="min-w-0 break-all text-right font-mono text-[var(--muted-foreground)]">
                  {pendingStopService.location}
                </span>
              </div>
            </div>

            {stopError && (
              <div className="mt-3 rounded-lg border border-[var(--destructive)]/25 bg-[var(--destructive)]/10 p-3 text-xs leading-5 text-[var(--destructive)]">
                {copy.ports.stopFailed}: {stopError}
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="secondary"
                className="h-9 px-4"
                disabled={stoppingPid === pendingStopService.pid}
                onClick={() => {
                  setPendingStopService(null);
                  setStopError(null);
                }}
              >
                {copy.ports.cancelStop}
              </Button>
              <Button
                variant="destructive"
                className="h-9 px-4"
                disabled={stoppingPid === pendingStopService.pid}
                onClick={confirmStopService}
              >
                {stoppingPid === pendingStopService.pid ? copy.ports.stopping : copy.ports.confirmStop}
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
