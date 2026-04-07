import { Cpu, Folder, GitBranch, Hash, RefreshCw, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getProcessTree } from "@/lib/ports";
import { cn } from "@/lib/utils";
import type { AppCopy, ProcessTreeNode, Service } from "@/types/app";

type PortsViewProps = {
  copy: AppCopy;
  services: Service[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  search: string;
  stoppingPid: number | null;
  onPageChange: (value: number) => void;
  onSearchChange: (value: string) => void;
  onStopService: (service: Service) => void;
  onRefresh: () => void;
};

function ProcessTree({ node, depth = 0 }: { node: ProcessTreeNode; depth?: number }) {
  return (
    <div className="relative">
      <div
        className={cn(
          "relative rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2",
          depth > 0 && "mt-2",
        )}
        style={{ marginLeft: depth > 0 ? 16 : 0 }}
      >
        {depth > 0 && (
          <div className="absolute -left-4 top-1/2 h-px w-4 bg-[var(--border)]" />
        )}
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="mt-1.5 size-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]" />
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-sm font-semibold">{node.name}</p>
              <span className="shrink-0 rounded-md bg-[var(--card)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--muted-foreground)]">
                pid:{node.pid}
              </span>
            </div>
            {node.command && (
              <p className="mt-1 line-clamp-2 break-all font-mono text-[11px] leading-4 text-[var(--muted-foreground)]">
                {node.command}
              </p>
            )}
            {!node.command && node.executable && (
              <p className="mt-1 truncate font-mono text-[11px] text-[var(--muted-foreground)]">
                {node.executable}
              </p>
            )}
          </div>
        </div>
      </div>
      {node.children.length > 0 && (
        <div className="relative">
          <div
            className="absolute bottom-3 top-0 w-px bg-[var(--border)]"
            style={{ left: depth > 0 ? 16 : 0 }}
          />
          {node.children.map((child) => (
            <ProcessTree key={`${child.pid}-${child.name}`} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

type RenderProcessTreeStateInput = {
  copy: AppCopy;
  error: string | null;
  loading: boolean;
  tree: ProcessTreeNode | null;
};

function renderProcessTreeState({ copy, error, loading, tree }: RenderProcessTreeStateInput) {
  if (loading) {
    return (
      <div className="rounded-lg bg-[var(--secondary)] p-3 text-xs leading-5 text-[var(--muted-foreground)]">
        {copy.ports.processTreeLoading}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-[var(--secondary)] p-3 text-xs leading-5 text-[var(--destructive)]">
        {copy.ports.processTreeLoadFailed}: {error}
      </div>
    );
  }

  if (tree) {
    return <ProcessTree node={tree} />;
  }

  return (
    <div className="rounded-lg bg-[var(--secondary)] p-3 text-xs leading-5 text-[var(--muted-foreground)]">
      {copy.ports.processTreeUnavailable}
    </div>
  );
}

type PortTableContentProps = {
  copy: AppCopy;
  error: string | null;
  loading: boolean;
  onSelectService: (service: Service) => void;
  onStopService: (service: Service) => void;
  selectedServiceId: string | undefined;
  services: Service[];
  stoppingPid: number | null;
};

function PortTableContent({
  copy,
  error,
  loading,
  onSelectService,
  onStopService,
  selectedServiceId,
  services,
  stoppingPid,
}: PortTableContentProps) {
  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center px-6 text-sm text-[var(--muted-foreground)]">
        {copy.ports.loading}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center px-6 text-sm text-[var(--destructive)]">
        {copy.ports.loadFailed}: {error}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center px-6 text-sm text-[var(--muted-foreground)]">
        {copy.ports.empty}
      </div>
    );
  }

  return (
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
            <TableRow
              key={service.id}
              className={cn(
                "group relative cursor-pointer text-[13px] transition-all duration-150 hover:bg-[var(--primary)]/[0.07] hover:shadow-[inset_3px_0_0_var(--primary),inset_0_1px_0_rgba(255,255,255,0.04)]",
                selectedServiceId === service.id &&
                  "bg-[var(--primary)]/[0.09] shadow-[inset_3px_0_0_var(--primary)]",
              )}
              onClick={() => onSelectService(service)}
            >
              <TableCell className="font-mono text-[var(--primary)] transition-colors group-hover:text-[var(--foreground)]">
                {service.port}
              </TableCell>
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
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-7 w-[64px] px-2"
                  disabled={stoppingPid === service.pid || service.pid === 0}
                  onClick={(event) => {
                    event.stopPropagation();
                    onStopService(service);
                  }}
                >
                  {stoppingPid === service.pid ? copy.ports.stopping : copy.controls.stop}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function PortsView({
  copy,
  services,
  total,
  page,
  pageSize,
  loading,
  error,
  search,
  stoppingPid,
  onPageChange,
  onSearchChange,
  onStopService,
  onRefresh,
}: PortsViewProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [processTree, setProcessTree] = useState<ProcessTreeNode | null>(null);
  const [processTreeLoading, setProcessTreeLoading] = useState(false);
  const [processTreeError, setProcessTreeError] = useState<string | null>(null);
  const selectedServiceId = selectedService?.id;
  const selectedPid = selectedService?.pid ?? null;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  useEffect(() => {
    if (!selectedServiceId) return;
    setSelectedService(services.find((service) => service.id === selectedServiceId) ?? null);
  }, [selectedServiceId, services]);

  useEffect(() => {
    if (selectedPid === null) {
      setProcessTree(null);
      setProcessTreeError(null);
      setProcessTreeLoading(false);
      return;
    }

    let cancelled = false;
    setProcessTree(null);
    setProcessTreeError(null);
    setProcessTreeLoading(true);

    getProcessTree(selectedPid)
      .then((tree) => {
        if (cancelled) return;
        setProcessTree(tree);
      })
      .catch((error) => {
        if (cancelled) return;
        setProcessTreeError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (!cancelled) {
          setProcessTreeLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedPid]);

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-3 overflow-hidden">
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
          <PortTableContent
            copy={copy}
            error={error}
            loading={loading}
            onSelectService={setSelectedService}
            onStopService={onStopService}
            selectedServiceId={selectedServiceId}
            services={services}
            stoppingPid={stoppingPid}
          />

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

      {selectedService && (
        <div className="absolute inset-0 z-30 flex justify-end overflow-hidden rounded-lg">
          <button
            type="button"
            aria-label={copy.ports.closeDetails}
            className="absolute inset-0 cursor-default bg-black/18 backdrop-blur-[1px]"
            onClick={() => setSelectedService(null)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={copy.ports.details}
            className="relative flex h-full w-[min(360px,74vw)] flex-col border-l border-[var(--border)] bg-[var(--panel)] shadow-[-28px_0_80px_rgba(0,0,0,0.34)]"
          >
            <div className="border-b border-[var(--border)] bg-[var(--card)]/92 px-4 py-3 backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                    {copy.ports.details}
                  </p>
                  <h2 className="mt-1 truncate text-lg font-semibold">{selectedService.name}</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={copy.ports.closeDetails}
                  onClick={() => setSelectedService(null)}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2">
                <Hash className="size-4 text-[var(--primary)]" />
                <span className="font-mono text-xl font-semibold text-[var(--primary)]">{selectedService.port}</span>
                <span className="text-xs text-[var(--muted-foreground)]">PID {selectedService.pid}</span>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 custom-scrollbar">
              <section className="rounded-lg border border-[var(--border)] bg-[var(--card)]/72 p-3">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <GitBranch className="size-4 text-[var(--primary)]" />
                  {copy.ports.processTree}
                </div>
                {renderProcessTreeState({
                  copy,
                  error: processTreeError,
                  loading: processTreeLoading,
                  tree: processTree,
                })}
              </section>

              <section className="rounded-lg border border-[var(--border)] bg-[var(--card)]/72 p-3">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Folder className="size-4 text-[var(--primary)]" />
                  {copy.table.path}
                </div>
                <p className="break-all font-mono text-xs leading-5 text-[var(--muted-foreground)]">
                  {selectedService.location}
                </p>
              </section>

              <section className="rounded-lg border border-[var(--border)] bg-[var(--card)]/72 p-3">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Cpu className="size-4 text-[var(--primary)]" />
                  {copy.ports.resourceSnapshot}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-[var(--secondary)] p-2">
                    <p className="text-[var(--muted-foreground)]">CPU</p>
                    <p className="mt-1 font-mono text-sm">{selectedService.cpu}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--secondary)] p-2">
                    <p className="text-[var(--muted-foreground)]">MEM</p>
                    <p className="mt-1 font-mono text-sm">{selectedService.memory}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--secondary)] p-2">
                    <p className="text-[var(--muted-foreground)]">{copy.table.uptime}</p>
                    <p className="mt-1 font-mono text-sm">{selectedService.uptime}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--secondary)] p-2">
                    <p className="text-[var(--muted-foreground)]">{copy.ports.updated}</p>
                    <p className="mt-1 font-mono text-sm">{selectedService.updatedAt}</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="flex shrink-0 gap-2 border-t border-[var(--border)] bg-[var(--card)]/92 p-3 backdrop-blur">
              <Button variant="secondary" className="h-9 flex-1" onClick={() => setSelectedService(null)}>
                {copy.ports.closeDetails}
              </Button>
              <Button
                variant="destructive"
                className="h-9 flex-1"
                disabled={stoppingPid === selectedService.pid || selectedService.pid === 0}
                onClick={() => onStopService(selectedService)}
              >
                {stoppingPid === selectedService.pid ? copy.ports.stopping : copy.controls.stop}
              </Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
