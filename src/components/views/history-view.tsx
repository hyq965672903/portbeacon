import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppCopy, HistoryEntry } from "@/types/app";

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
  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <Card className="shrink-0">
        <CardContent className="flex items-center justify-between gap-3 p-3">
          <div className="flex flex-wrap gap-3">
          <Select value={historyFilter} onValueChange={onHistoryFilterChange}>
            <SelectTrigger className="h-11 w-[180px]">
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
            <SelectTrigger className="h-11 w-[180px]">
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
            <SelectTrigger className="h-11 w-[180px]">
              <SelectValue placeholder={copy.history.timeRange} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">{copy.history.recent1h}</SelectItem>
              <SelectItem value="24h">{copy.history.recent24h}</SelectItem>
              <SelectItem value="7d">{copy.history.recent7d}</SelectItem>
            </SelectContent>
          </Select>

          <div className="min-w-0">
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={copy.history.searchPlaceholder}
              className="h-11 w-[420px] max-w-full"
            />
          </div>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {copy.history.showing} {entries.length} {copy.history.records}
          </Badge>
        </CardContent>
      </Card>

      <Card className="min-h-0 flex-1 overflow-hidden">
        <CardContent className="min-h-0 p-0">
          <div className="h-full">
            <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[168px]">{copy.table.time}</TableHead>
                <TableHead className="w-[80px]">{copy.table.port}</TableHead>
                <TableHead className="w-[90px]">{copy.table.pid}</TableHead>
                <TableHead className="w-[110px]">{copy.table.action}</TableHead>
                <TableHead className="w-[120px]">{copy.table.executor}</TableHead>
                <TableHead>{copy.table.sourcePath}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-[var(--muted-foreground)]">{entry.timestamp}</TableCell>
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
                  <TableCell>{entry.executor}</TableCell>
                  <TableCell className="max-w-[320px]">
                    <div className="truncate text-[var(--muted-foreground)]">{entry.location}</div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
