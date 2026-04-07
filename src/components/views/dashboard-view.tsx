import { Activity, AlertTriangle, CircleDot, Cpu, Wifi } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AppCopy, Service } from "@/types/app";

function MetricCard({
  label,
  value,
  hint,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  accent: string;
  icon: typeof Activity;
}) {
  return (
    <Card className="relative min-h-[156px] overflow-hidden">
      <div className={cn("absolute inset-x-0 top-0 h-20 bg-gradient-to-b to-transparent", accent)} />
      <CardHeader className="relative pb-2 pt-5">
        <div className="flex items-center justify-between gap-3">
          <CardDescription>{label}</CardDescription>
          <div className="flex size-10 items-center justify-center rounded-lg bg-white/50 text-[var(--foreground)] dark:bg-black/20">
            <Icon className="size-4" />
          </div>
        </div>
        <CardTitle className="text-3xl md:text-4xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="relative pt-0">
        <p className="line-clamp-2 text-xs text-[var(--primary)]">{hint}</p>
      </CardContent>
    </Card>
  );
}

type DashboardViewProps = {
  copy: AppCopy;
  services: Service[];
};

export function DashboardView({ copy, services }: DashboardViewProps) {
  const activeCount = services.filter((item) => item.status === "active").length;
  const atRiskCount = services.filter((item) => item.status === "warning").length;
  const totalMemory = services.reduce((sum, service) => sum + Number.parseInt(service.memory, 10), 0);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <section className="grid min-h-0 gap-3 lg:grid-cols-2 2xl:grid-cols-4">
        <MetricCard
          label={copy.dashboard.openPorts}
          value={String(services.length)}
          hint={copy.dashboard.stats.openPortsLabel}
          accent="from-[rgba(19,217,196,0.18)]"
          icon={Wifi}
        />
        <MetricCard
          label={copy.dashboard.activeProcesses}
          value={String(activeCount)}
          hint={copy.dashboard.stats.activeLabel}
          accent="from-[rgba(32,117,255,0.16)]"
          icon={Activity}
        />
        <MetricCard
          label={copy.dashboard.riskyProcesses}
          value={String(atRiskCount)}
          hint={copy.dashboard.stats.riskyLabel}
          accent="from-[rgba(245,158,11,0.18)]"
          icon={AlertTriangle}
        />
        <MetricCard
          label={copy.dashboard.memoryUsage}
          value={`${totalMemory} MB`}
          hint={copy.dashboard.stats.memoryLabel}
          accent="from-[rgba(129,140,248,0.18)]"
          icon={Cpu}
        />
      </section>

      <section className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1.3fr)_320px]">
        <Card className="min-h-0">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <CardDescription>{copy.dashboard.topActive}</CardDescription>
                <CardTitle>{copy.dashboard.quickActions}</CardTitle>
              </div>
              <Badge variant={atRiskCount > 0 ? "warning" : "success"}>
                {atRiskCount > 0 ? `${atRiskCount} ${copy.dashboard.pending}` : copy.dashboard.allStable}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 pt-0 md:grid-cols-2">
            {services.slice(0, 4).map((service) => (
              <div key={service.id} className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/80 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{service.name}</p>
                    <p className="truncate text-xs text-[var(--muted-foreground)]">localhost:{service.port}</p>
                  </div>
                  <Badge variant={service.status === "active" ? "success" : service.status === "warning" ? "warning" : "destructive"}>
                    {copy.status[service.status]}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-[var(--muted-foreground)]">Memory</p>
                    <p className="truncate">{service.memory}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[var(--muted-foreground)]">PID</p>
                    <p className="truncate font-mono">{service.pid}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Card className="overflow-hidden">
            <div className="border-b border-[var(--border)] bg-gradient-to-b from-[rgba(19,217,196,0.08)] to-transparent px-5 py-3">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
                {copy.dashboard.pocketView}
              </p>
              <p className="mt-1 text-base font-semibold">{copy.dashboard.mobilePreview}</p>
            </div>
            <CardContent className="flex justify-center p-4">
              <div className="w-[220px] rounded-lg border border-[var(--border)] bg-[#05080b] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
                <div className="mb-2 flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
                  <span>09:41</span>
                  <span>PortBeacon</span>
                  <Wifi className="size-3.5" />
                </div>
                <div className="space-y-2">
                  <div className="rounded-lg bg-[var(--secondary)] p-3">
                    <p className="text-xs text-[var(--muted-foreground)]">{copy.dashboard.openPorts}</p>
                    <div className="mt-2 flex items-end justify-between">
                      <p className="text-2xl font-semibold">04</p>
                      <Badge variant="success">{copy.status.active}</Badge>
                    </div>
                  </div>
                  {services.slice(0, 3).map((service) => (
                    <div
                      key={service.id}
                      className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/75 p-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="truncate text-sm font-medium">{service.name}</p>
                          <p className="text-[11px] text-[var(--muted-foreground)]">localhost:{service.port}</p>
                        </div>
                        <CircleDot className="size-4 text-[var(--primary)]" />
                      </div>
                    </div>
                  ))}
                  <Button className="h-9 w-full">{copy.controls.switchAll}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
