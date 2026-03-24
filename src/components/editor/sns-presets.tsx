"use client";

import { useEditorStore } from "./hooks/use-editor-store";
import { SNS_PRESETS, CROP_RATIOS } from "./lib/presets";
import { cn } from "@/lib/utils";

const PLATFORM_ICONS: Record<string, string> = {
  Instagram: "📷",
  Facebook: "📘",
  YouTube: "▶️",
  TikTok: "🎵",
  "Twitter/X": "𝕏",
};

/**
 * Crop ratio preset selector -- radio-style buttons for aspect ratios.
 */
export function CropRatioSelector() {
  const selectedPreset = useEditorStore((s) => s.selectedPreset);
  const setSelectedPreset = useEditorStore((s) => s.setSelectedPreset);

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-2">
        Aspect Ratio
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {CROP_RATIOS.map((ratio) => (
          <button
            key={ratio.name}
            type="button"
            className={cn(
              "px-2 py-1.5 text-xs rounded-md border transition-colors",
              selectedPreset === ratio.name
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-accent border-border"
            )}
            onClick={() => {
              setSelectedPreset(
                selectedPreset === ratio.name ? null : ratio.name
              );
            }}
          >
            {ratio.name}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * SNS platform preset selector -- buttons for common social media sizes.
 */
export function SnsPresetSelector() {
  const selectedPreset = useEditorStore((s) => s.selectedPreset);
  const setSelectedPreset = useEditorStore((s) => s.setSelectedPreset);

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-2">
        SNS Presets
      </p>
      <div className="space-y-1">
        {SNS_PRESETS.map((preset) => {
          const ratio = preset.width / preset.height;
          // Find matching crop ratio name or use platform name
          const matchingRatio = CROP_RATIOS.find(
            (r) => r.ratio !== null && Math.abs(r.ratio - ratio) < 0.01
          );
          const isActive = selectedPreset === (matchingRatio?.name ?? preset.name);

          return (
            <button
              key={preset.name}
              type="button"
              className={cn(
                "w-full flex items-center gap-2 px-2.5 py-2 text-xs rounded-md border transition-colors text-left",
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-accent border-border"
              )}
              onClick={() => {
                // Set the matching crop ratio if available, otherwise set the preset name
                const presetKey = matchingRatio?.name ?? preset.name;
                setSelectedPreset(
                  selectedPreset === presetKey ? null : presetKey
                );
              }}
            >
              <span className="text-sm">
                {PLATFORM_ICONS[preset.platform] ?? "📱"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{preset.name}</p>
                <p className="text-[10px] opacity-70">
                  {preset.width} x {preset.height}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
