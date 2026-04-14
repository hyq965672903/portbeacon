import { Activity, ChevronRight, Database, Layers3, LoaderCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AppCopy, PortServiceVO } from "@/types/app";

type TrayViewProps = {
  copy: AppCopy;
  services: PortServiceVO[];
  loading: boolean;
  error: string | null;
  onOpenMainWindow: () => void;
};

export function TrayView({ copy, services, loading, error, onOpenMainWindow }: TrayViewProps) {
  const activeCount = services.filter((service) => service.status === "active").length;
  const databaseCount = services.filter((service) => service.classification.category === "database").length;
  const previewItems = services.slice(0, 5);

  return (
    <div className="tray-shell flex h-screen flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)] text-[var(--foreground)] shadow-[0_24px_80px_rgba(0,0,0,0.42)]">
      <div className="border-b border-[var(--border)] px-4 pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
              {copy.brand.title}
            </p>
            <h1 className="mt-1 text-xl font-semibold">{copy.dashboard.quickActions}</h1>
          </div>
          <Badge variant="success">{copy.status.active}</Badge>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <TrayMetric icon={Layers3} label={copy.dashboard.openPorts} value={String(services.length)} />
          <TrayMetric icon={Activity} label={copy.dashboard.activeProcesses} value={String(activeCount)} />
          <TrayMetric icon={Database} label="DB" value={String(databaseCount)} />
        </div>
      </div>

      <div className="min-h-0 flex-1 px-3 py-3">
        {loading ? (
          <StateBlock icon={LoaderCircle} text={copy.ports.loading} spin />
        ) : error ? (
          <StateBlock text={`${copy.ports.loadFailed}: ${error}`} />
        ) : previewItems.length === 0 ? (
          <StateBlock text={copy.ports.empty} />
        ) : (
          <div className="space-y-2">
            {previewItems.map((service) => (
              <button
                key={service.id}
                type="button"
                className="flex w-full items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)]/88 px-3 py-2.5 text-left transition-colors hover:bg-[var(--secondary)]"
                onClick={onOpenMainWindow}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{service.attribution.displayName}</span>
                    <span className="shrink-0 rounded bg-[var(--secondary)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--primary)]">
                      :{service.port}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[11px] text-[var(--muted-foreground)]">
                    {service.attribution.sourceApp ?? service.location}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-[var(--muted-foreground)]" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-[var(--border)] p-3">
        <Button className="h-10 w-full" onClick={onOpenMainWindow}>
          {copy.controls.openApp}
        </Button>
      </div>
    </div>
  );
}

function TrayMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]/76 px-2.5 py-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
        <Icon className="size-3" />
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function StateBlock({
  icon: Icon,
  text,
  spin = false,
}: {
  icon?: typeof LoaderCircle;
  text: string;
  spin?: boolean;
}) {
  return (
    <div className="flex h-full min-h-[180px] items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--card)]/55 px-4 text-center text-sm text-[var(--muted-foreground)]">
      <div className="flex max-w-[220px] flex-col items-center gap-3">
        {Icon ? <Icon className={spin ? "size-5 animate-spin" : "size-5"} /> : null}
        <span>{text}</span>
      </div>
    </div>
  );
}
