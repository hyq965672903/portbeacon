import { Languages, LaptopMinimal, MoonStar, SunMedium } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Locale, ThemeMode } from "@/lib/i18n";
import { AppCopy, View } from "@/types/app";

type WorkspaceHeaderProps = {
  copy: AppCopy;
  locale: Locale;
  currentView: View;
  onLocaleChange: (value: Locale) => void;
  themeMode: ThemeMode;
  resolvedTheme: "light" | "dark";
  onThemeChange: (value: ThemeMode) => void;
};

export function WorkspaceHeader({
  copy,
  locale,
  currentView,
  onLocaleChange,
  themeMode,
  resolvedTheme,
  onThemeChange,
}: WorkspaceHeaderProps) {
  const ThemeIcon = themeMode === "system" ? LaptopMinimal : resolvedTheme === "dark" ? MoonStar : SunMedium;
  const nextThemeMode: ThemeMode = themeMode === "system" ? "light" : themeMode === "light" ? "dark" : "system";
  const nextLocale: Locale = locale === "zh" ? "en" : "zh";
  const themeLabel = themeMode === "system" ? copy.controls.system : themeMode === "light" ? copy.controls.light : copy.controls.dark;
  const localeLabel = locale === "zh" ? "中" : "EN";

  return (
    <header className="flex h-full items-center justify-between overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 shadow-[0_20px_80px_rgba(0,0,0,0.2)] backdrop-blur-xl">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
          {copy.brand.subtitle}
        </p>
        <h1 className="truncate text-sm font-semibold">{copy.nav[currentView]}</h1>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-8 px-2.5"
          aria-label={`${copy.controls.language}: ${locale === "zh" ? "简体中文" : "English"}`}
          title={`${copy.controls.language}: ${locale === "zh" ? "简体中文" : "English"}`}
          onClick={() => onLocaleChange(nextLocale)}
        >
          <Languages className="size-4 text-[var(--muted-foreground)]" />
          <span className="min-w-6 text-center text-xs font-semibold">{localeLabel}</span>
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-8 px-2.5"
          aria-label={`${copy.controls.theme}: ${themeLabel}`}
          title={`${copy.controls.theme}: ${themeLabel}`}
          onClick={() => onThemeChange(nextThemeMode)}
        >
          <ThemeIcon className="size-4 text-[var(--muted-foreground)]" />
          <span className="text-xs">{themeLabel}</span>
        </Button>
      </div>
    </header>
  );
}
