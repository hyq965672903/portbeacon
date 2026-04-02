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
    <div className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--secondary)]/65 p-4 md:flex-row md:items-center md:justify-between">
      <div className="max-w-xl">
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{description}</p>
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
    <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--secondary)]/70 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-black/25">
          <Icon className={cn("size-4", accent)} />
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{sublabel}</p>
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
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_340px]">
      <div className="space-y-5">
        <section>
          <h1 className="text-3xl font-semibold">{copy.settings.title}</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">{copy.settings.description}</p>
        </section>

        <Card>
          <CardHeader>
            <CardDescription>{copy.settings.policyDesc}</CardDescription>
            <CardTitle>{copy.settings.policy}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
                <div className="w-[180px]">
                  <Select defaultValue="7d">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24 小时</SelectItem>
                      <SelectItem value="7d">7 天</SelectItem>
                      <SelectItem value="30d">30 天</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>{copy.settings.terminalConfigDesc}</CardDescription>
            <CardTitle>{copy.settings.terminalConfig}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[#06090d] p-4 font-mono text-sm text-[var(--muted-foreground)]">
              <p>HOST=0.0.0.0</p>
              <p>PORT_SCAN_RANGE=3000-9000</p>
              <p>SAFE_MODE=true</p>
              <p>TIMEOUT=10.0</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary">{copy.controls.resetParams}</Button>
              <Button>{copy.controls.saveChanges}</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardDescription>{copy.settings.status}</CardDescription>
            <CardTitle>{copy.settings.realtime}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          <CardHeader>
            <CardDescription>{copy.settings.desktopDesc}</CardDescription>
            <CardTitle>{copy.settings.desktop}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[var(--muted-foreground)]">
            <p>macOS Sequoia 15.3</p>
            <p>Tauri Runtime 2.x</p>
            <p>Watcher latency 250ms</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
