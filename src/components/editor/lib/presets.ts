export interface SnsPreset {
  name: string;
  width: number;
  height: number;
  platform: string;
}

export const SNS_PRESETS: SnsPreset[] = [
  { name: "Instagram Story", width: 1080, height: 1920, platform: "Instagram" },
  { name: "Instagram Post", width: 1080, height: 1080, platform: "Instagram" },
  { name: "Facebook Post", width: 1200, height: 630, platform: "Facebook" },
  { name: "YouTube Thumbnail", width: 1280, height: 720, platform: "YouTube" },
  { name: "TikTok", width: 1080, height: 1920, platform: "TikTok" },
  { name: "Twitter/X Post", width: 1200, height: 675, platform: "Twitter/X" },
];

export const CROP_RATIOS = [
  { name: "Free", ratio: null },
  { name: "1:1", ratio: 1 },
  { name: "4:5", ratio: 4 / 5 },
  { name: "9:16", ratio: 9 / 16 },
  { name: "16:9", ratio: 16 / 9 },
  { name: "1.91:1", ratio: 1.91 },
] as const;
