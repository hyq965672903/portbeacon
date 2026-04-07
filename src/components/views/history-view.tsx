import { ChevronDown, ChevronRight, RefreshCw, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AppCopy, HistoryAction, HistoryEntry } from "@/types/app";

type HistoryViewProps = {
  copy: AppCopy;
  entries: HistoryEntry[];
  error: string | null;
  historyFilter: string;
  loading: boolean;
  portFilter: string;
  rangeFilter: string;
  search: string;
  onHistoryFilterChange: (value: string) => void;
  onPortFilterChange: (value: string) => void;
  onRangeFilterChange: (value: string) => void;
  onRefresh: () => void;
  onSearchChange: (value: string) => void;
};

function actionLabel(copy: AppCopy, action: HistoryAction) {
  return copy.history.actions[action];
}

function actionVariant(action: HistoryAction) {
  if (action === "detected") return "success";
  if (action === "released" || action === "ignored") return "outline";
  if (action === "failed") return "destructive";
  return "secondary";
}

function actionAccent(action: HistoryAction) {
  if (action === "detected") return "bg-emerald-400";
  if (action === "released") return "bg-sky-300";
  if (action === "replaced") return "bg-amber-300";
  if (action === "stopped") return "bg-red-400";
  if (action === "failed") return "bg-rose-400";
  return "bg-[var(--muted-foreground)]";
}

function formatTimestamp(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(timestamp));
}

function groupHistoryByPort(entries: HistoryEntry[]) {
  const groups = new Map<number, HistoryEntry[]>();

  for (const entry of entries) {
    const group = groups.get(entry.port) ?? [];
    group.push(entry);
    groups.set(entry.port, group);
  }

  return Array.from(groups.entries())
    .map(([port, groupEntries]) => ({
      entries: groupEntries,
      latest: groupEntries[0],
      port,
    }))
    .sort((left, right) => right.latest.timestamp - left.latest.timestamp);
}

type HistoryDetailDrawerProps = {
  copy: AppCopy;
  entry: HistoryEntry;
  onClose: () => void;
};

function HistoryDetailDrawer({ copy, entry, onClose }: HistoryDetailDrawerProps) {
  return (
    <div className="absolute inset-0 z-30 flex justify-end overflow-hidden rounded-lg">
      <button
        type="button"
        aria-label={copy.history.closeDetails}
        className="absolute inset-0 cursor-default bg-black/18 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={copy.history.details}
        className="relative flex h-full w-[min(360px,74vw)] flex-col border-l border-[var(--border)] bg-[var(--panel)] shadow-[-28px_0_80px_rgba(0,0,0,0.34)]"
      >
        <div className="border-b border-[var(--border)] bg-[var(--card)]/92 px-4 py-3 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                {copy.history.details}
              </p>
              <h2 className="mt-1 truncate text-lg font-semibold">:{entry.port}</h2>
            </div>
            <Button variant="ghost" size="icon" className="size-8" aria-label={copy.history.closeDetails} onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2">
            <Badge variant={actionVariant(entry.action)}>{actionLabel(copy, entry.action)}</Badge>
            <span className="font-mono text-xs text-[var(--muted-foreground)]">{formatTimestamp(entry.timestamp)}</span>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 custom-scrollbar">
          <section className="rounded-lg border border-[var(--border)] bg-[var(--card)]/72 p-3">
            <p className="text-sm font-semibold">{entry.processName}</p>
            <p className="mt-1 font-mono text-xs text-[var(--muted-foreground)]">
              PID {entry.pid ?? "-"} · {entry.protocol.toUpperCase()} · {entry.source}
            </p>
            <p className="mt-3 break-all font-mono text-xs leading-5 text-[var(--muted-foreground)]">{entry.location}</p>
          </section>

          <section className="rounded-lg border border-[var(--border)] bg-[var(--card)]/72 p-3 text-xs leading-5 text-[var(--muted-foreground)]">
            <p><span className="text-[var(--foreground)]">{copy.history.result}</span>: {entry.result}</p>
            {entry.reason && <p><span className="text-[var(--foreground)]">{copy.history.reason}</span>: {entry.reason}</p>}
            {entry.error && <p className="text-[var(--destructive)]">{entry.error}</p>}
          </section>
        </div>
      </aside>
    </div>
  );
}

type HistoryGroupsProps = {
  copy: AppCopy;
  expandedPorts: Set<number>;
  groups: ReturnType<typeof groupHistoryByPort>;
  search: string;
  onSelectEntry: (entry: HistoryEntry) => void;
  onTogglePort: (port: number) => void;
};

function HistoryGroups({
  copy,
  expandedPorts,
  groups,
  search,
  onSelectEntry,
  onTogglePort,
}: HistoryGroupsProps) {
  return (
    <div className="space-y-2 p-2">
      {groups.map((group) => {
        const expanded = expandedPorts.has(group.port) || search.trim().length > 0;
        const latest = group.latest;

        return (
          <section key={group.port} className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)]/78">
            <button
              type="button"
              className="grid w-full grid-cols-[auto_72px_minmax(0,1fr)_92px_88px] items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[var(--primary)]/[0.06]"
              onClick={() => onTogglePort(group.port)}
            >
              {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              <span className="font-mono text-base font-semibold text-[var(--primary)]">:{group.port}</span>
              <span className="min-w-0 truncate text-sm font-semibold">{latest.processName}</span>
              <Badge variant={actionVariant(latest.action)}>{actionLabel(copy, latest.action)}</Badge>
              <span className="font-mono text-xs text-[var(--muted-foreground)]">
                {group.entries.length} {copy.history.events}
              </span>
            </button>

            {expanded && (
              <div className="border-t border-[var(--border)]">
                {group.entries.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className="grid w-full grid-cols-[72px_92px_86px_minmax(0,1fr)] items-center gap-3 px-3 py-2 text-left text-[13px] transition-colors hover:bg-[var(--primary)]/[0.06]"
                    onClick={() => onSelectEntry(entry)}
                  >
                    <span className="font-mono text-xs text-[var(--muted-foreground)]">{formatTimestamp(entry.timestamp)}</span>
                    <span className="flex items-center gap-2">
                      <span className={cn("size-2 rounded-full", actionAccent(entry.action))} />
                      {actionLabel(copy, entry.action)}
                    </span>
                    <span className="font-mono text-xs text-[var(--muted-foreground)]">PID {entry.pid ?? "-"}</span>
                    <span className="min-w-0 truncate text-[var(--muted-foreground)]">{entry.location}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function renderHistoryContent({
  copy,
  error,
  expandedPorts,
  groups,
  search,
  onSelectEntry,
  onTogglePort,
}: HistoryGroupsProps & { error: string | null }) {
  if (error) {
    return (
      <div className="flex min-h-[280px] items-center justify-center px-6 text-sm text-[var(--destructive)]">
        {error}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex min-h-[280px] items-center justify-center px-6 text-sm text-[var(--muted-foreground)]">
        {copy.history.empty}
      </div>
    );
  }

  return (
    <HistoryGroups
      copy={copy}
      expandedPorts={expandedPorts}
      groups={groups}
      search={search}
      onSelectEntry={onSelectEntry}
      onTogglePort={onTogglePort}
    />
  );
}

export function HistoryView({
  copy,
  entries,
  error,
  historyFilter,
  loading,
  portFilter,
  rangeFilter,
  search,
  onHistoryFilterChange,
  onPortFilterChange,
  onRangeFilterChange,
  onRefresh,
  onSearchChange,
}: HistoryViewProps) {
  const [expandedPorts, setExpandedPorts] = useState<Set<number>>(new Set());
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const groups = useMemo(() => groupHistoryByPort(entries), [entries]);
  const portOptions = useMemo(() => groups.map((group) => group.port), [groups]);

  function togglePort(port: number) {
    setExpandedPorts((current) => {
      const next = new Set(current);
      if (next.has(port)) {
        next.delete(port);
      } else {
        next.add(port);
      }
      return next;
    });
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <Card className="shrink-0">
        <CardContent className="grid grid-cols-[124px_104px_104px_minmax(0,1fr)_auto] items-center gap-2 p-2">
          <Select value={historyFilter} onValueChange={onHistoryFilterChange}>
            <SelectTrigger className="h-8 w-[124px] px-3 text-xs">
              <SelectValue placeholder={copy.history.actionType} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{copy.history.allActions}</SelectItem>
              <SelectItem value="detected">{copy.history.actions.detected}</SelectItem>
              <SelectItem value="released">{copy.history.actions.released}</SelectItem>
              <SelectItem value="replaced">{copy.history.actions.replaced}</SelectItem>
              <SelectItem value="stopped">{copy.history.actions.stopped}</SelectItem>
              <SelectItem value="ignored">{copy.history.actions.ignored}</SelectItem>
              <SelectItem value="failed">{copy.history.actions.failed}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={portFilter} onValueChange={onPortFilterChange}>
            <SelectTrigger className="h-8 w-[104px] px-3 text-xs">
              <SelectValue placeholder={copy.history.portRange} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{copy.history.allPorts}</SelectItem>
              {portOptions.map((port) => (
                <SelectItem key={port} value={String(port)}>{port}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={rangeFilter} onValueChange={onRangeFilterChange}>
            <SelectTrigger className="h-8 w-[104px] px-3 text-xs">
              <SelectValue placeholder={copy.history.timeRange} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">{copy.history.recent1h}</SelectItem>
              <SelectItem value="24h">{copy.history.recent24h}</SelectItem>
              <SelectItem value="7d">{copy.history.recent7d}</SelectItem>
              <SelectItem value="all">{copy.history.allTime}</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={copy.history.searchPlaceholder}
              className="h-8 pl-9 text-xs"
            />
          </div>

          <Button variant="secondary" size="sm" className="h-8 gap-1.5 px-3" disabled={loading} onClick={onRefresh}>
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            {copy.ports.refresh}
          </Button>
        </CardContent>
      </Card>

      <Card className="min-h-0 flex-1 overflow-hidden">
        <CardContent className="h-full min-h-0 p-0">
          <div className="h-full overflow-y-auto custom-scrollbar">
            {renderHistoryContent({
              copy,
              error,
              expandedPorts,
              groups,
              search,
              onSelectEntry: setSelectedEntry,
              onTogglePort: togglePort,
            })}
          </div>
        </CardContent>
      </Card>

      {selectedEntry && <HistoryDetailDrawer copy={copy} entry={selectedEntry} onClose={() => setSelectedEntry(null)} />}
    </div>
  );
}
