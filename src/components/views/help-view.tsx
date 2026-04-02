import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AppCopy } from "@/types/app";

type HelpViewProps = {
  copy: AppCopy;
};

export function HelpView({ copy }: HelpViewProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardDescription>{copy.help.quickGuide}</CardDescription>
          <CardTitle>{copy.help.howToUse}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-[var(--muted-foreground)]">
          <p>{copy.help.step1}</p>
          <p>{copy.help.step2}</p>
          <p>{copy.help.step3}</p>
          <p>{copy.help.step4}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>{copy.help.healthCheck}</CardDescription>
          <CardTitle>{copy.help.recommended}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Badge variant="success">{copy.help.safeMode}</Badge>
          <Badge variant="secondary">{copy.help.keepLogs}</Badge>
          <Badge variant="outline">{copy.help.confirmUnknown}</Badge>
          <Separator className="my-2" />
          <p className="text-sm text-[var(--muted-foreground)]">{copy.help.note}</p>
        </CardContent>
      </Card>
    </div>
  );
}
