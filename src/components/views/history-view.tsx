import { Activity, CircleSlash, Play, Search, Square } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppCopy, HistoryEntry } from "@/types/app";

function MetricCell({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: typeof Activity;
  accent: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-2.5 py-2">
      <div className="min-w-0">
        <p className="truncate text-[10px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
          {label}
        </p>
        <p className="mt-0.5 font-mono text-lg font-semibold">{value}</p>
      </div>
      <div className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${accent}`}>
        <Icon className="size-4" />
      </div>
    </div>
  );
}

function actionVariant(action: HistoryEntry["action"]) {
  if (action === "started") return "success";
  if (action === "ignored") return "outline";
  return "destructive";
}

type HistoryViewProps = {
  copy: AppCopy;
  entries: HistoryEntry[];
  historyFilter: string;
  portFilter: string;
  rangeFilter: string;
  search: string;
  onHistoryFilterChange: (value: string) => void;
  onPortFilterChange: (value: string) => void;
  onRangeFilterChange: (value: string) => void;
  onSearchChange: (value: string) => void;
};

export function HistoryView({
  copy,
  entries,
  historyFilter,
  portFilter,
  rangeFilter,
  search,
  onHistoryFilterChange,
  onPortFilterChange,
  onRangeFilterChange,
  onSearchChange,
}: HistoryViewProps) {
  const startedCount = entries.filter((entry) => entry.action === "started").length;
  const stoppedCount = entries.filter((entry) => entry.action === "stopped").length;
  const ignoredCount = entries.filter((entry) => entry.action === "ignored").length;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <Card className="shrink-0 overflow-hidden">
        <CardContent className="grid divide-y divide-[var(--border)] p-0 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <MetricCell
            label={copy.history.showing}
            value={entries.length}
            icon={Activity}
            accent="bg-[var(--secondary)] text-[var(--primary)]"
          />
          <MetricCell
            label={copy.history.started}
            value={startedCount}
            icon={Play}
            accent="bg-emerald-500/15 text-emerald-300"
          />
          <MetricCell
            label={copy.history.stopped}
            value={stoppedCount}
            icon={Square}
            accent="bg-rose-500/15 text-rose-300"
          />
          <MetricCell
            label={copy.history.ignored}
            value={ignoredCount}
            icon={CircleSlash}
            accent="bg-amber-500/15 text-amber-300"
          />
        </CardContent>
      </Card>

      <Card className="shrink-0">
        <CardContent className="grid grid-cols-[136px_112px_112px_minmax(0,1fr)_auto] items-center gap-2 p-2">
            <Select value={historyFilter} onValueChange={onHistoryFilterChange}>
            <SelectTrigger className="h-8 w-[136px] px-3 text-xs">
                <SelectValue placeholder={copy.history.actionType} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{copy.history.allActions}</SelectItem>
                <SelectItem value="started">{copy.history.started}</SelectItem>
                <SelectItem value="stopped">{copy.history.stopped}</SelectItem>
                <SelectItem value="ignored">{copy.history.ignored}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={portFilter} onValueChange={onPortFilterChange}>
            <SelectTrigger className="h-8 w-[112px] px-3 text-xs">
                <SelectValue placeholder={copy.history.portRange} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{copy.history.allPorts}</SelectItem>
                <SelectItem value="3000">3000</SelectItem>
                <SelectItem value="5432">5432</SelectItem>
                <SelectItem value="6379">6379</SelectItem>
                <SelectItem value="8080">8080</SelectItem>
              </SelectContent>
            </Select>

            <Select value={rangeFilter} onValueChange={onRangeFilterChange}>
            <SelectTrigger className="h-8 w-[112px] px-3 text-xs">
                <SelectValue placeholder={copy.history.timeRange} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">{copy.history.recent1h}</SelectItem>
                <SelectItem value="24h">{copy.history.recent24h}</SelectItem>
                <SelectItem value="7d">{copy.history.recent7d}</SelectItem>
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

          <Badge variant="secondary" className="shrink-0 px-2 py-0.5 tracking-[0.1em]">
            {copy.history.showing} {entries.length} {copy.history.records}
          </Badge>
        </CardContent>
      </Card>

      <Card className="min-h-0 flex-1 overflow-hidden">
        <CardContent className="h-full min-h-0 p-0">
          <div className="h-full overflow-y-auto custom-scrollbar">
            {entries.length === 0 ? (
              <div className="flex min-h-[280px] items-center justify-center px-6 text-sm text-[var(--muted-foreground)]">
                {copy.ports.empty}
              </div>
            ) : (
              <Table className="table-fixed w-full">
                <TableHeader className="sticky top-0 z-10 bg-[var(--card)] backdrop-blur">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[138px]">{copy.table.time}</TableHead>
                    <TableHead className="w-[68px]">{copy.table.port}</TableHead>
                    <TableHead className="w-[76px]">{copy.table.pid}</TableHead>
                    <TableHead className="w-[104px]">{copy.table.action}</TableHead>
                    <TableHead>{copy.table.executor}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id} className="text-[13px]">
                      <TableCell className="font-mono text-[12px] text-[var(--muted-foreground)]">{entry.timestamp}</TableCell>
                      <TableCell className="font-mono">{entry.port}</TableCell>
                      <TableCell className="font-mono text-[var(--muted-foreground)]">{entry.pid}</TableCell>
                      <TableCell>
                        <Badge variant={actionVariant(entry.action)}>
                          {entry.action === "started"
                            ? copy.history.started
                            : entry.action === "stopped"
                              ? copy.history.stopped
                              : copy.history.ignored}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[320px]">
                        <div className="min-w-0">
                          <p className="truncate">{entry.executor}</p>
                          <p className="truncate text-[11px] text-[var(--muted-foreground)]">{entry.location}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
