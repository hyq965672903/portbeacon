import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { AppCopy } from "@/types/app";

type HelpViewProps = {
  copy: AppCopy;
};

function GuideStep({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/58 px-3 py-2.5 text-sm leading-5 text-[var(--muted-foreground)]">
      {text}
    </div>
  );
}

export function HelpView({ copy }: HelpViewProps) {
  return (
    <div className="h-full min-h-0 overflow-y-auto custom-scrollbar">
      <div className="mx-auto grid w-full max-w-[980px] gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
        <Card>
          <CardContent className="space-y-3 p-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                {copy.help.quickGuide}
              </p>
              <h2 className="mt-1 text-lg font-semibold">{copy.help.howToUse}</h2>
            </div>
            <div className="grid gap-2">
              <GuideStep text={copy.help.step1} />
              <GuideStep text={copy.help.step2} />
              <GuideStep text={copy.help.step3} />
              <GuideStep text={copy.help.step4} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex h-full min-h-[220px] flex-col gap-3 p-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                {copy.help.healthCheck}
              </p>
              <h2 className="mt-1 text-lg font-semibold">{copy.help.recommended}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">{copy.help.safeMode}</Badge>
              <Badge variant="secondary">{copy.help.keepLogs}</Badge>
              <Badge variant="outline">{copy.help.confirmUnknown}</Badge>
            </div>
            <p className="mt-auto rounded-lg border border-[var(--border)] bg-[var(--secondary)]/58 p-3 text-xs leading-5 text-[var(--muted-foreground)]">
              {copy.help.note}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
