import { AlertTriangle, Gauge, Search, Server, ShieldCheck } from "lucide-react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { AppCopy, Service, ServiceStatus } from "@/types/app";

function MetricCell({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: typeof Server;
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
      <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", accent)}>
        <Icon className="size-4" />
      </div>
    </div>
  );
}

type PortsViewProps = {
  copy: AppCopy;
  services: Service[];
  search: string;
  statusFilter: "all" | ServiceStatus;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: "all" | ServiceStatus) => void;
};

export function PortsView({
  copy,
  services,
  search,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
}: PortsViewProps) {
  const filteredServices = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return services.filter((service) => {
      const matchesStatus = statusFilter === "all" || service.status === statusFilter;
      const matchesKeyword =
        !keyword ||
        `${service.port} ${service.pid} ${service.name} ${service.location}`.toLowerCase().includes(keyword);
      return matchesStatus && matchesKeyword;
    });
  }, [search, services, statusFilter]);

  const activeCount = filteredServices.filter((item) => item.status === "active").length;
  const warningCount = filteredServices.filter((item) => item.status === "warning").length;
  const stoppedCount = filteredServices.filter((item) => item.status === "stopped").length;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <Card className="shrink-0 overflow-hidden">
        <CardContent className="grid divide-y divide-[var(--border)] p-0 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <MetricCell
            label={copy.ports.showing}
            value={filteredServices.length}
            icon={Server}
            accent="bg-[var(--secondary)] text-[var(--primary)]"
          />
          <MetricCell
            label={copy.ports.active}
            value={activeCount}
            icon={ShieldCheck}
            accent="bg-emerald-500/15 text-emerald-300"
          />
          <MetricCell
            label={copy.ports.warning}
            value={warningCount}
            icon={AlertTriangle}
            accent="bg-amber-500/15 text-amber-300"
          />
          <MetricCell
            label={copy.ports.stopped}
            value={stoppedCount}
            icon={Gauge}
            accent="bg-rose-500/15 text-rose-300"
          />
        </CardContent>
      </Card>

      <Card className="shrink-0">
        <CardContent className="grid grid-cols-[minmax(0,1fr)_124px_auto] items-center gap-2 p-2">
          <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <Input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={copy.ports.searchPlaceholder}
              className="h-8 w-full pl-9 text-xs"
              />
          </div>
            <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as "all" | ServiceStatus)}>
            <SelectTrigger className="h-8 w-[124px] px-3 text-xs">
                <SelectValue placeholder={copy.ports.statusFilter} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{copy.ports.allStatus}</SelectItem>
                <SelectItem value="active">{copy.ports.active}</SelectItem>
                <SelectItem value="warning">{copy.ports.warning}</SelectItem>
                <SelectItem value="stopped">{copy.ports.stopped}</SelectItem>
              </SelectContent>
            </Select>

          <Badge variant="secondary" className="shrink-0 px-2 py-0.5 tracking-[0.1em]">
            {copy.ports.showing} {filteredServices.length} {copy.ports.items}
          </Badge>
        </CardContent>
      </Card>

      <Card className="min-h-0 flex-1 overflow-hidden">
        <CardContent className="min-h-0 p-0">
          {filteredServices.length === 0 ? (
            <div className="flex min-h-[320px] items-center justify-center px-6 text-sm text-[var(--muted-foreground)]">
              {copy.ports.empty}
            </div>
          ) : (
            <div className="h-full overflow-y-auto custom-scrollbar">
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
                  {filteredServices.map((service) => (
                    <TableRow key={service.id} className="text-[13px]">
                      <TableCell className="font-mono text-[var(--primary)]">{service.port}</TableCell>
                      <TableCell className="font-mono text-[var(--muted-foreground)]">{service.pid}</TableCell>
                      <TableCell>
                        <div className="flex min-w-0 items-center gap-2">
                          <div
                            className={cn(
                              "size-2.5 shrink-0 rounded-full",
                              service.status === "active"
                                ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]"
                                : service.status === "warning"
                                  ? "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.7)]"
                                  : "bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.7)]",
                            )}
                          />
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
        </CardContent>
      </Card>
    </div>
  );
}
