import { Search } from "lucide-react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { AppCopy, Service, ServiceStatus } from "@/types/app";

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

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <Card className="shrink-0">
        <CardContent className="flex items-center justify-between gap-3 p-3">
          <div className="flex flex-wrap gap-3">
          <div className="relative w-[420px] max-w-full min-w-0">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={copy.ports.searchPlaceholder}
              className="h-11 w-full pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as "all" | ServiceStatus)}>
            <SelectTrigger className="h-11 w-[180px]">
              <SelectValue placeholder={copy.ports.statusFilter} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{copy.ports.allStatus}</SelectItem>
              <SelectItem value="active">{copy.ports.active}</SelectItem>
              <SelectItem value="warning">{copy.ports.warning}</SelectItem>
              <SelectItem value="stopped">{copy.ports.stopped}</SelectItem>
            </SelectContent>
          </Select>
          </div>
          <Badge variant="secondary" className="shrink-0">
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
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[82px]">{copy.table.port}</TableHead>
                    <TableHead className="w-[96px]">{copy.table.pid}</TableHead>
                    <TableHead className="w-[210px]">{copy.table.service}</TableHead>
                    <TableHead>{copy.table.path}</TableHead>
                    <TableHead className="w-[96px]">{copy.table.uptime}</TableHead>
                    <TableHead className="w-[120px]">{copy.table.resources}</TableHead>
                    <TableHead className="w-[96px] text-right">{copy.table.action}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-mono text-[var(--primary)]">{service.port}</TableCell>
                      <TableCell className="font-mono text-[var(--muted-foreground)]">{service.pid}</TableCell>
                      <TableCell>
                        <div className="flex min-w-0 items-center gap-3">
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
                            <p className="truncate text-xs text-[var(--muted-foreground)]">{copy.status[service.status]}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="truncate text-[var(--muted-foreground)]">{service.location}</div>
                      </TableCell>
                      <TableCell>{service.uptime}</TableCell>
                      <TableCell>
                        <div className="text-[11px] leading-4 text-[var(--muted-foreground)]">
                          <p>CPU {service.cpu}</p>
                          <p>MEM {service.memory}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="destructive" size="sm" className="h-8 w-[78px]">
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
