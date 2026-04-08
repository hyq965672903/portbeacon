import { check, type DownloadEvent, type Update } from "@tauri-apps/plugin-updater";
import { Activity, Download, Plus, RefreshCw, ShieldCheck, Trash2, Wifi } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { AppCopy, UserFeedbackRuleVO } from "@/types/app";

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
  activeFingerprintEnabled: boolean;
  autoKill: boolean;
  monitorIntervalSeconds: number;
  portRules: UserFeedbackRuleVO[];
  portRulesError: string | null;
  strictMode: boolean;
  onActiveFingerprintEnabledChange: (value: boolean) => void;
  onAutoKillChange: (value: boolean) => void;
  onMonitorIntervalSecondsChange: (value: number) => void;
  onPortRuleChange: (rule: UserFeedbackRuleVO) => void;
  onPortRuleDelete: (id: string) => void;
  onStrictModeChange: (value: boolean) => void;
};

export function SettingsView({
  copy,
  activeFingerprintEnabled,
  autoKill,
  monitorIntervalSeconds,
  portRules,
  portRulesError,
  strictMode,
  onActiveFingerprintEnabledChange,
  onAutoKillChange,
  onMonitorIntervalSecondsChange,
  onPortRuleChange,
  onPortRuleDelete,
  onStrictModeChange,
}: SettingsViewProps) {
  const [rulePort, setRulePort] = useState("");
  const [ruleName, setRuleName] = useState("");
  const [ruleVisibility, setRuleVisibility] = useState<"focused" | "collapsed">("focused");
  const [availableUpdate, setAvailableUpdate] = useState<Update | null>(null);
  const [updateStatus, setUpdateStatus] = useState<"idle" | "checking" | "available" | "none" | "installing" | "ready" | "error">("idle");
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateDownloadedBytes, setUpdateDownloadedBytes] = useState(0);
  const [updateTotalBytes, setUpdateTotalBytes] = useState<number | null>(null);

  function createPortRule() {
    const port = Number(rulePort);
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
      return;
    }

    const visibility = ruleVisibility;
    const name = ruleName.trim() || `${visibility === "focused" ? copy.settings.ruleFocusPrefix : copy.settings.ruleCollapsePrefix} ${port}`;
    const rule: UserFeedbackRuleVO = {
      id: `user-port-${port}-${visibility}`,
      name,
      enabled: true,
      matcher: { ports: [port] },
      category: visibility === "focused" ? "dev-server" : "user-collapsed",
      visibility,
      reason: visibility === "focused" ? copy.settings.ruleFocusedReason : copy.settings.ruleCollapsedReason,
    };

    onPortRuleChange(rule);
    setRulePort("");
    setRuleName("");
  }

  async function handleCheckUpdate() {
    setAvailableUpdate(null);
    setUpdateDownloadedBytes(0);
    setUpdateTotalBytes(null);
    setUpdateMessage("");
    setUpdateStatus("checking");

    try {
      const update = await check({ timeout: 10000 });
      if (!update) {
        setUpdateStatus("none");
        setUpdateMessage(copy.settings.updateNone);
        return;
      }

      setAvailableUpdate(update);
      setUpdateStatus("available");
      setUpdateMessage(update.body?.trim() || copy.settings.updateAvailableDesc);
    } catch (error) {
      setUpdateStatus("error");
      setUpdateMessage(formatUpdaterError(copy, error));
    }
  }

  async function handleInstallUpdate() {
    if (!availableUpdate || updateStatus === "installing") {
      return;
    }

    setUpdateStatus("installing");
    setUpdateDownloadedBytes(0);
    setUpdateTotalBytes(null);
    setUpdateMessage(copy.settings.updateInstallingDesc);

    try {
      await availableUpdate.downloadAndInstall((event: DownloadEvent) => {
        if (event.event === "Started") {
          setUpdateDownloadedBytes(0);
          setUpdateTotalBytes(event.data.contentLength ?? null);
        }

        if (event.event === "Progress") {
          setUpdateDownloadedBytes((value) => value + event.data.chunkLength);
        }

        if (event.event === "Finished") {
          setUpdateMessage(copy.settings.updateReadyDesc);
        }
      });

      setUpdateStatus("ready");
      setUpdateMessage(copy.settings.updateReadyDesc);
    } catch (error) {
      setUpdateStatus("error");
      setUpdateMessage(formatUpdaterError(copy, error));
    }
  }

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
                title={copy.settings.activeFingerprint}
                description={copy.settings.activeFingerprintDesc}
                control={<Switch checked={activeFingerprintEnabled} onCheckedChange={onActiveFingerprintEnabledChange} />}
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

        <Card>
          <CardContent className="space-y-3 p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-[var(--muted-foreground)]">{copy.settings.updateManagerDesc}</p>
                <h3 className="text-base font-semibold">{copy.settings.updateManager}</h3>
              </div>
              <Button
                variant="secondary"
                size="sm"
                disabled={updateStatus === "checking" || updateStatus === "installing"}
                onClick={handleCheckUpdate}
              >
                <RefreshCw className={cn("size-3.5", updateStatus === "checking" && "animate-spin")} />
                {copy.settings.checkUpdate}
              </Button>
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/58 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {availableUpdate
                      ? `${copy.settings.updateAvailable}: v${availableUpdate.version}`
                      : copy.settings.updateIdle}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {availableUpdate?.date
                      ? `${copy.settings.updateDate}: ${formatUpdateDate(availableUpdate.date)}`
                      : copy.settings.updateManualOnly}
                  </p>
                </div>

                {availableUpdate && (
                  <Button
                    size="sm"
                    disabled={updateStatus === "installing" || updateStatus === "ready"}
                    onClick={handleInstallUpdate}
                  >
                    <Download className="size-3.5" />
                    {copy.settings.installUpdate}
                  </Button>
                )}
              </div>

              {(updateMessage || updateStatus === "checking" || updateStatus === "installing") && (
                <div
                  className={cn(
                    "mt-3 rounded-lg border px-3 py-2 text-xs leading-5",
                    updateStatus === "error"
                      ? "border-[var(--destructive)]/30 bg-[var(--destructive)]/10 text-[var(--destructive)]"
                      : "border-[var(--border)] bg-[var(--card)]/72 text-[var(--muted-foreground)]",
                  )}
                >
                  {updateStatus === "checking" && copy.settings.updateChecking}
                  {updateStatus === "installing" && (
                    <>
                      {copy.settings.updateInstalling}
                      {updateTotalBytes
                        ? ` · ${formatBytes(updateDownloadedBytes)} / ${formatBytes(updateTotalBytes)}`
                        : updateDownloadedBytes > 0
                          ? ` · ${formatBytes(updateDownloadedBytes)}`
                          : ""}
                    </>
                  )}
                  {updateStatus !== "checking" && updateStatus !== "installing" && updateMessage}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-[var(--muted-foreground)]">{copy.settings.ruleManagerDesc}</p>
                <h3 className="text-base font-semibold">{copy.settings.ruleManager}</h3>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-2.5 py-1 text-xs text-[var(--muted-foreground)]">
                {portRules.length} {copy.settings.rules}
              </div>
            </div>

            <div className="grid gap-2 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/58 p-2 md:grid-cols-[160px_minmax(0,1fr)_130px_auto]">
              <Input
                className="h-9 text-xs"
                inputMode="numeric"
                placeholder={copy.settings.rulePortPlaceholder}
                value={rulePort}
                onChange={(event) => setRulePort(event.target.value)}
              />
              <Input
                className="h-9 text-xs"
                placeholder={copy.settings.ruleNamePlaceholder}
                value={ruleName}
                onChange={(event) => setRuleName(event.target.value)}
              />
              <Select value={ruleVisibility} onValueChange={(value) => setRuleVisibility(value as "focused" | "collapsed")}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="focused">{copy.settings.ruleFocused}</SelectItem>
                  <SelectItem value="collapsed">{copy.settings.ruleCollapsed}</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={createPortRule}>
                <Plus className="size-3.5" />
                {copy.settings.addRule}
              </Button>
            </div>

            {portRulesError && (
              <div className="rounded-lg border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 px-3 py-2 text-xs text-[var(--destructive)]">
                {portRulesError}
              </div>
            )}

            <div className="grid gap-2">
              {portRules.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[var(--border)] p-4 text-center text-xs text-[var(--muted-foreground)]">
                  {copy.settings.ruleEmpty}
                </div>
              ) : (
                portRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="grid gap-2 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/58 px-3 py-2 md:grid-cols-[minmax(0,1fr)_auto_auto]"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">{rule.name}</p>
                        <span className="rounded-full bg-[var(--card)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                          {rule.visibility === "focused" ? copy.settings.ruleFocused : copy.settings.ruleCollapsed}
                        </span>
                      </div>
                      <p className="mt-1 truncate font-mono text-[11px] text-[var(--muted-foreground)]">
                        {describeRule(rule)}
                      </p>
                    </div>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(enabled) => onPortRuleChange({ ...rule, enabled })}
                    />
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => onPortRuleDelete(rule.id)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function describeRule(rule: UserFeedbackRuleVO) {
  const parts = [
    rule.matcher.ports?.length ? `ports=${rule.matcher.ports.join(",")}` : "",
    rule.matcher.processNameIncludes?.length ? `process=${rule.matcher.processNameIncludes.join("|")}` : "",
    rule.matcher.executableIncludes?.length ? `exe=${rule.matcher.executableIncludes.join("|")}` : "",
    rule.matcher.cwdIncludes?.length ? `cwd=${rule.matcher.cwdIncludes.join("|")}` : "",
  ].filter(Boolean);

  return parts.join(" · ") || rule.category;
}

function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function formatUpdateDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatUpdaterError(copy: AppCopy, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("valid release JSON")) {
    return copy.settings.updateChannelNotReady;
  }

  return message;
}
