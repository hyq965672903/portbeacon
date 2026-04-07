import { RefreshCw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { AppCopy, Service } from "@/types/app";

type PortsViewProps = {
  copy: AppCopy;
  services: Service[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  search: string;
  onPageChange: (value: number) => void;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
};

export function PortsView({
  copy,
  services,
  total,
  page,
  pageSize,
  loading,
  error,
  search,
  onPageChange,
  onSearchChange,
  onRefresh,
}: PortsViewProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <Card className="shrink-0">
        <CardContent className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 p-2">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={copy.ports.searchPlaceholder}
              className="h-8 w-full pl-9 text-xs"
            />
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="h-8 shrink-0 gap-1.5 px-3"
            disabled={loading}
            onClick={onRefresh}
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            {copy.ports.refresh}
          </Button>
        </CardContent>
      </Card>

      <Card className="min-h-0 flex-1 overflow-hidden">
        <CardContent className="flex h-full min-h-0 flex-col p-0">
          {loading ? (
            <div className="flex min-h-0 flex-1 items-center justify-center px-6 text-sm text-[var(--muted-foreground)]">
              {copy.ports.loading}
            </div>
          ) : error ? (
            <div className="flex min-h-0 flex-1 items-center justify-center px-6 text-sm text-[var(--destructive)]">
              {copy.ports.loadFailed}: {error}
            </div>
          ) : services.length === 0 ? (
            <div className="flex min-h-0 flex-1 items-center justify-center px-6 text-sm text-[var(--muted-foreground)]">
              {copy.ports.empty}
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
              <Table className="table-fixed w-full">
                <TableHeader className="sticky top-0 z-10 bg-[var(--card)] backdrop-blur">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[68px]">{copy.table.port}</TableHead>
                    <TableHead className="w-[76px]">{copy.table.pid}</TableHead>
                    <TableHead>{copy.table.service}</TableHead>
                    <TableHead className="w-[82px]">{copy.table.uptime}</TableHead>
                    <TableHead className="w-[92px]">{copy.table.resources}</TableHead>
                    <TableHead className="w-[76px] text-right">{copy.table.action}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id} className="text-[13px]">
                      <TableCell className="font-mono text-[var(--primary)]">{service.port}</TableCell>
                      <TableCell className="font-mono text-[var(--muted-foreground)]">{service.pid}</TableCell>
                      <TableCell>
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="size-2.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]" />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{service.name}</p>
                            <p className="truncate text-[11px] text-[var(--muted-foreground)]">{service.location}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-[12px] leading-4">
                          <p>{service.uptime}</p>
                          <p className="text-[11px] text-[var(--muted-foreground)]">{service.updatedAt}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-[11px] leading-4 text-[var(--muted-foreground)]">
                          <p>CPU {service.cpu}</p>
                          <p>MEM {service.memory}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="destructive" size="sm" className="h-7 w-[64px] px-2">
                          {copy.controls.stop}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-t border-[var(--border)] bg-[var(--card)]/95 px-2.5 text-xs text-[var(--muted-foreground)] backdrop-blur">
            <span className="min-w-0 truncate">
              {copy.ports.total} {total} {copy.ports.items} · {copy.ports.page} {page} {copy.ports.of} {totalPages}
            </span>
            <div className="flex shrink-0 gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                className="h-7 px-2.5"
                disabled={!canGoPrevious || loading}
                onClick={() => onPageChange(page - 1)}
              >
                {copy.ports.previous}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="h-7 px-2.5"
                disabled={!canGoNext || loading}
                onClick={() => onPageChange(page + 1)}
              >
                {copy.ports.next}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
