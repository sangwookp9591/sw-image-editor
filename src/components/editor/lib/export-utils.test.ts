import { describe, it, expect } from "vitest";
import { buildExportConfig, getFileExtension, getFileName } from "./export-utils";

describe("buildExportConfig", () => {
  it("returns undefined quality for PNG (lossless)", () => {
    const result = buildExportConfig("png", 90, 1);
    expect(result).toEqual({ format: "png", quality: undefined, multiplier: 1 });
  });

  it("converts quality to 0-1 scale for JPEG", () => {
    const result = buildExportConfig("jpeg", 85, 2);
    expect(result).toEqual({ format: "jpeg", quality: 0.85, multiplier: 2 });
  });

  it("converts quality to 0-1 scale for WebP", () => {
    const result = buildExportConfig("webp", 50, 0.5);
    expect(result).toEqual({ format: "webp", quality: 0.5, multiplier: 0.5 });
  });
});

describe("getFileExtension", () => {
  it('returns "png" for png format', () => {
    expect(getFileExtension("png")).toBe("png");
  });

  it('returns "jpg" for jpeg format', () => {
    expect(getFileExtension("jpeg")).toBe("jpg");
  });

  it('returns "webp" for webp format', () => {
    expect(getFileExtension("webp")).toBe("webp");
  });
});

describe("getFileName", () => {
  it("combines base name with correct extension", () => {
    expect(getFileName("my-photo", "jpeg")).toBe("my-photo.jpg");
  });
});
