import { Activity, ShieldCheck, Wifi } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { AppCopy } from "@/types/app";

function SettingRow({
  title,
  description,
  control,
}: {
  title: string;
  description: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/65 p-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="max-w-2xl">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{description}</p>
      </div>
      <div>{control}</div>
    </div>
  );
}

function StatusLine({
  icon: Icon,
  label,
  value,
  accent,
  sublabel,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  accent: string;
  sublabel: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--secondary)]/70 px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-black/25">
          <Icon className={cn("size-4", accent)} />
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-[11px] text-[var(--muted-foreground)]">{sublabel}</p>
        </div>
      </div>
      <p className={cn("text-sm font-medium", accent)}>{value}</p>
    </div>
  );
}

type SettingsViewProps = {
  copy: AppCopy;
  autoKill: boolean;
  strictMode: boolean;
  onAutoKillChange: (value: boolean) => void;
  onStrictModeChange: (value: boolean) => void;
};

export function SettingsView({
  copy,
  autoKill,
  strictMode,
  onAutoKillChange,
  onStrictModeChange,
}: SettingsViewProps) {
  return (
    <div className="grid h-full min-h-0 gap-3 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,340px)]">
      <div className="flex min-h-0 flex-col gap-3 overflow-auto custom-scrollbar pr-1">
        <section className="rounded-lg border border-[var(--border)] bg-[var(--card)]/60 px-4 py-3">
          <h1 className="text-xl font-semibold">{copy.settings.title}</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{copy.settings.description}</p>
        </section>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{copy.settings.policyDesc}</CardDescription>
            <CardTitle>{copy.settings.policy}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
              title={copy.settings.logRetention}
              description={copy.settings.logRetentionDesc}
              control={
                <div className="w-[152px]">
                  <Select defaultValue="7d">
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">{copy.settings.retention24h}</SelectItem>
                      <SelectItem value="7d">{copy.settings.retention7d}</SelectItem>
                      <SelectItem value="30d">{copy.settings.retention30d}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{copy.settings.terminalConfigDesc}</CardDescription>
            <CardTitle>{copy.settings.terminalConfig}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-[var(--border)] bg-[#06090d] p-3 font-mono text-xs text-[var(--muted-foreground)]">
              <p>HOST=0.0.0.0</p>
              <p>PORT_SCAN_RANGE=3000-9000</p>
              <p>SAFE_MODE=true</p>
              <p>TIMEOUT=10.0</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm">{copy.controls.resetParams}</Button>
              <Button size="sm">{copy.controls.saveChanges}</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{copy.settings.status}</CardDescription>
            <CardTitle>{copy.settings.realtime}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusLine
              icon={ShieldCheck}
              label={copy.settings.guardService}
              value={copy.settings.running}
              accent="text-emerald-300"
              sublabel={copy.settings.collecting}
            />
            <StatusLine
              icon={Activity}
              label={copy.settings.cpu}
              value="11.2% active"
              accent="text-[var(--primary)]"
              sublabel={copy.settings.collecting}
            />
            <StatusLine
              icon={Wifi}
              label={copy.settings.network}
              value="16 sockets"
              accent="text-sky-300"
              sublabel={copy.settings.collecting}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{copy.settings.desktopDesc}</CardDescription>
            <CardTitle>{copy.settings.desktop}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[var(--muted-foreground)]">
            <p>macOS Sequoia 15.3</p>
            <p>Tauri Runtime 2.x</p>
            <p>Watcher latency 250ms</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
