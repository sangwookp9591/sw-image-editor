import { describe, it, expect } from "vitest";
import { SNS_PRESETS, CROP_RATIOS } from "./presets";

describe("SNS_PRESETS", () => {
  it("has exactly 6 entries", () => {
    expect(SNS_PRESETS).toHaveLength(6);
  });

  it("each preset has name, width, height, platform fields", () => {
    for (const preset of SNS_PRESETS) {
      expect(preset).toHaveProperty("name");
      expect(preset).toHaveProperty("width");
      expect(preset).toHaveProperty("height");
      expect(preset).toHaveProperty("platform");
      expect(typeof preset.name).toBe("string");
      expect(typeof preset.width).toBe("number");
      expect(typeof preset.height).toBe("number");
      expect(typeof preset.platform).toBe("string");
    }
  });

  it("Instagram Story is 1080x1920", () => {
    const igStory = SNS_PRESETS.find((p) => p.name === "Instagram Story");
    expect(igStory).toBeDefined();
    expect(igStory!.width).toBe(1080);
    expect(igStory!.height).toBe(1920);
  });

  it("Instagram Post is 1080x1080", () => {
    const igPost = SNS_PRESETS.find((p) => p.name === "Instagram Post");
    expect(igPost).toBeDefined();
    expect(igPost!.width).toBe(1080);
    expect(igPost!.height).toBe(1080);
  });

  it("all presets have positive dimensions", () => {
    for (const preset of SNS_PRESETS) {
      expect(preset.width).toBeGreaterThan(0);
      expect(preset.height).toBeGreaterThan(0);
    }
  });
});

describe("CROP_RATIOS", () => {
  it("has exactly 6 entries", () => {
    expect(CROP_RATIOS).toHaveLength(6);
  });

  it("includes Free with null ratio", () => {
    const free = CROP_RATIOS.find((r) => r.name === "Free");
    expect(free).toBeDefined();
    expect(free!.ratio).toBeNull();
  });

  it("all non-null ratios are positive numbers", () => {
    for (const crop of CROP_RATIOS) {
      if (crop.ratio !== null) {
        expect(typeof crop.ratio).toBe("number");
        expect(crop.ratio).toBeGreaterThan(0);
      }
    }
  });

  it("includes 1:1 ratio", () => {
    const square = CROP_RATIOS.find((r) => r.name === "1:1");
    expect(square).toBeDefined();
    expect(square!.ratio).toBe(1);
  });

  it("includes 16:9 ratio", () => {
    const widescreen = CROP_RATIOS.find((r) => r.name === "16:9");
    expect(widescreen).toBeDefined();
    expect(widescreen!.ratio).toBeCloseTo(16 / 9);
  });
});
