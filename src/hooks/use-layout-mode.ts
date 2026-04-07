import { useEffect, useState } from "react";

export type LayoutMode = "compact" | "regular" | "wide";

// 布局目标：
// - compact：适配 800x600、900x650
// - regular：适配 1024x768、1280x720、1366x768
// - wide：适配 1440x900、1600x1000、1920x1080+
function resolveLayoutMode(width: number, height: number): LayoutMode {
  if (width < 1024 || height < 700) {
    return "compact";
  }

  if (width >= 1440 && height >= 900) {
    return "wide";
  }

  return "regular";
}

function getLayoutMode() {
  if (typeof window === "undefined") {
    return "regular";
  }

  return resolveLayoutMode(window.innerWidth, window.innerHeight);
}

export function useLayoutMode() {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(getLayoutMode);

  useEffect(() => {
    const syncLayoutMode = () => setLayoutMode(getLayoutMode());

    syncLayoutMode();
    window.addEventListener("resize", syncLayoutMode);

    return () => window.removeEventListener("resize", syncLayoutMode);
  }, []);

  return layoutMode;
}
