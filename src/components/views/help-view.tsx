import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AppCopy } from "@/types/app";

type HelpViewProps = {
  copy: AppCopy;
};

export function HelpView({ copy }: HelpViewProps) {
  return (
    <div className="grid h-full min-h-0 gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <Card className="min-h-0">
        <CardHeader className="pb-3">
          <CardDescription>{copy.help.quickGuide}</CardDescription>
          <CardTitle>{copy.help.howToUse}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-[var(--muted-foreground)] md:grid-cols-2">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/70 p-3">{copy.help.step1}</div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/70 p-3">{copy.help.step2}</div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/70 p-3">{copy.help.step3}</div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/70 p-3">{copy.help.step4}</div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{copy.help.healthCheck}</CardDescription>
            <CardTitle>{copy.help.recommended}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">{copy.help.safeMode}</Badge>
              <Badge variant="secondary">{copy.help.keepLogs}</Badge>
              <Badge variant="outline">{copy.help.confirmUnknown}</Badge>
            </div>
            <Separator />
            <p className="text-sm text-[var(--muted-foreground)]">{copy.help.note}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{copy.help.healthCheck}</CardDescription>
            <CardTitle>PortBeacon</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-[var(--muted-foreground)]">
            <p>{copy.settings.description}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
