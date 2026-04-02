import { Languages, LaptopMinimal, MoonStar, SunMedium } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Locale, ThemeMode } from "@/lib/i18n";
import { AppCopy } from "@/types/app";

type WorkspaceHeaderProps = {
  copy: AppCopy;
  locale: Locale;
  onLocaleChange: (value: Locale) => void;
  themeMode: ThemeMode;
  resolvedTheme: "light" | "dark";
  onThemeChange: (value: ThemeMode) => void;
};

export function WorkspaceHeader({
  copy,
  locale,
  onLocaleChange,
  themeMode,
  resolvedTheme,
  onThemeChange,
}: WorkspaceHeaderProps) {
  const ThemeIcon = themeMode === "system" ? LaptopMinimal : resolvedTheme === "dark" ? MoonStar : SunMedium;

  return (
    <header className="flex h-full items-center justify-end overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--panel)] px-5 py-4 shadow-[0_40px_100px_rgba(0,0,0,0.2)] backdrop-blur-xl md:px-6">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="min-w-[160px]">
          <Select value={locale} onValueChange={(value) => onLocaleChange(value as Locale)}>
            <SelectTrigger className="h-10">
              <div className="flex items-center gap-2">
                <Languages className="size-4 text-[var(--muted-foreground)]" />
                <SelectValue aria-label={copy.controls.language} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="zh">简体中文</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[160px]">
          <Select value={themeMode} onValueChange={(value) => onThemeChange(value as ThemeMode)}>
            <SelectTrigger className="h-10">
              <div className="flex items-center gap-2">
                <ThemeIcon className="size-4 text-[var(--muted-foreground)]" />
                <SelectValue aria-label={copy.controls.theme} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">{copy.controls.system}</SelectItem>
              <SelectItem value="light">{copy.controls.light}</SelectItem>
              <SelectItem value="dark">{copy.controls.dark}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}
