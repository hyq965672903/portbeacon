import { Activity, ShieldCheck, Wifi } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { AppCopy } from "@/types/app";

function SettingRow({
  title,
  description,
  control,
}: {
  title: string;
  description: string;
  control: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/58 px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-[var(--muted-foreground)]">{description}</p>
      </div>
      {control}
    </div>
  );
}

function StatusPill({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/58 px-3 py-2">
      <Icon className={cn("size-4 shrink-0", accent)} />
      <div className="min-w-0">
        <p className="truncate text-xs text-[var(--muted-foreground)]">{label}</p>
        <p className={cn("truncate text-sm font-semibold", accent)}>{value}</p>
      </div>
    </div>
  );
}

type SettingsViewProps = {
  copy: AppCopy;
  autoKill: boolean;
  monitorIntervalSeconds: number;
  strictMode: boolean;
  onAutoKillChange: (value: boolean) => void;
  onMonitorIntervalSecondsChange: (value: number) => void;
  onStrictModeChange: (value: boolean) => void;
};

export function SettingsView({
  copy,
  autoKill,
  monitorIntervalSeconds,
  strictMode,
  onAutoKillChange,
  onMonitorIntervalSecondsChange,
  onStrictModeChange,
}: SettingsViewProps) {
  return (
    <div className="h-full min-h-0 overflow-y-auto custom-scrollbar">
      <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-3">
        <Card className="overflow-hidden">
          <CardContent className="grid gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)]">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                {copy.settings.policyDesc}
              </p>
              <h2 className="mt-1 text-lg font-semibold">{copy.settings.title}</h2>
              <p className="mt-1 line-clamp-2 max-w-2xl text-xs leading-5 text-[var(--muted-foreground)]">
                {copy.settings.description}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 min-[960px]:grid-cols-3 lg:grid-cols-1">
              <StatusPill
                icon={ShieldCheck}
                label={copy.settings.guardService}
                value={copy.settings.running}
                accent="text-emerald-300"
              />
              <StatusPill
                icon={Activity}
                label={copy.settings.cpu}
                value="11.2%"
                accent="text-[var(--primary)]"
              />
              <StatusPill
                icon={Wifi}
                label={copy.settings.network}
                value="16"
                accent="text-sky-300"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <Card>
            <CardContent className="space-y-2.5 p-3">
              <div className="mb-1 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-[var(--muted-foreground)]">{copy.settings.policyDesc}</p>
                  <h3 className="text-base font-semibold">{copy.settings.policy}</h3>
                </div>
              </div>
              <SettingRow
                title={copy.settings.autoKill}
                description={copy.settings.autoKillDesc}
                control={<Switch checked={autoKill} onCheckedChange={onAutoKillChange} />}
              />
              <SettingRow
                title={copy.settings.strictMode}
                description={copy.settings.strictModeDesc}
                control={<Switch checked={strictMode} onCheckedChange={onStrictModeChange} />}
              />
              <SettingRow
                title={copy.settings.monitorInterval}
                description={copy.settings.monitorIntervalDesc}
                control={
                  <Select
                    value={String(monitorIntervalSeconds)}
                    onValueChange={(value) => onMonitorIntervalSecondsChange(Number(value))}
                  >
                    <SelectTrigger className="h-8 w-[124px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">{copy.settings.interval2s}</SelectItem>
                      <SelectItem value="5">{copy.settings.interval5s}</SelectItem>
                      <SelectItem value="10">{copy.settings.interval10s}</SelectItem>
                    </SelectContent>
                  </Select>
                }
              />
              <SettingRow
                title={copy.settings.logRetention}
                description={copy.settings.logRetentionDesc}
                control={
                  <Select defaultValue="7d">
                    <SelectTrigger className="h-8 w-[124px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">{copy.settings.retention24h}</SelectItem>
                      <SelectItem value="7d">{copy.settings.retention7d}</SelectItem>
                      <SelectItem value="30d">{copy.settings.retention30d}</SelectItem>
                    </SelectContent>
                  </Select>
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex h-full min-h-[220px] flex-col gap-3 p-3">
              <div>
                <p className="text-xs text-[var(--muted-foreground)]">{copy.settings.terminalConfigDesc}</p>
                <h3 className="text-base font-semibold">{copy.settings.terminalConfig}</h3>
              </div>
              <div className="grid flex-1 content-start gap-1.5 rounded-lg border border-[var(--border)] bg-[#06090d] p-3 font-mono text-[11px] text-[var(--muted-foreground)]">
                <p>HOST=0.0.0.0</p>
                <p>PORT_SCAN_RANGE=3000-9000</p>
                <p>SAFE_MODE=true</p>
                <p>TIMEOUT=10.0</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm">
                  {copy.controls.resetParams}
                </Button>
                <Button size="sm">{copy.controls.saveChanges}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
