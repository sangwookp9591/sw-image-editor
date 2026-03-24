import { describe, it, expect } from "vitest";
import {
  constrainToAspectRatio,
  clampCropRegion,
  getCropPixelCoords,
} from "./crop-utils";

describe("constrainToAspectRatio", () => {
  it("returns square with same area center for ratio 1", () => {
    const rect = { x: 10, y: 20, width: 200, height: 100 };
    const result = constrainToAspectRatio(rect, 1);
    // Should be square, keeping center
    expect(result.width).toBe(result.height);
    // Center should be preserved
    const origCenterX = rect.x + rect.width / 2;
    const origCenterY = rect.y + rect.height / 2;
    const newCenterX = result.x + result.width / 2;
    const newCenterY = result.y + result.height / 2;
    expect(newCenterX).toBeCloseTo(origCenterX);
    expect(newCenterY).toBeCloseTo(origCenterY);
  });

  it("returns 16:9 rect within bounds for ratio 16/9", () => {
    const rect = { x: 0, y: 0, width: 400, height: 400 };
    const result = constrainToAspectRatio(rect, 16 / 9);
    const actualRatio = result.width / result.height;
    expect(actualRatio).toBeCloseTo(16 / 9);
    // Should fit within original rect
    expect(result.width).toBeLessThanOrEqual(rect.width);
    expect(result.height).toBeLessThanOrEqual(rect.height);
  });

  it("returns original rect unchanged for null ratio (free crop)", () => {
    const rect = { x: 10, y: 20, width: 300, height: 150 };
    const result = constrainToAspectRatio(rect, null);
    expect(result).toEqual(rect);
  });

  it("constrains to 4:5 aspect ratio", () => {
    const rect = { x: 50, y: 50, width: 200, height: 200 };
    const result = constrainToAspectRatio(rect, 4 / 5);
    const actualRatio = result.width / result.height;
    expect(actualRatio).toBeCloseTo(4 / 5);
  });

  it("constrains to 9:16 (tall) aspect ratio", () => {
    const rect = { x: 0, y: 0, width: 300, height: 300 };
    const result = constrainToAspectRatio(rect, 9 / 16);
    const actualRatio = result.width / result.height;
    expect(actualRatio).toBeCloseTo(9 / 16);
  });
});

describe("clampCropRegion", () => {
  it("clamps region within canvas boundaries", () => {
    const region = { x: -10, y: -20, width: 200, height: 150 };
    const bounds = { width: 800, height: 600 };
    const result = clampCropRegion(region, bounds);
    expect(result.x).toBeGreaterThanOrEqual(0);
    expect(result.y).toBeGreaterThanOrEqual(0);
    expect(result.x + result.width).toBeLessThanOrEqual(bounds.width);
    expect(result.y + result.height).toBeLessThanOrEqual(bounds.height);
  });

  it("does not modify region already within bounds", () => {
    const region = { x: 10, y: 20, width: 100, height: 80 };
    const bounds = { width: 800, height: 600 };
    const result = clampCropRegion(region, bounds);
    expect(result).toEqual(region);
  });

  it("clamps region that extends past right and bottom edges", () => {
    const region = { x: 750, y: 550, width: 100, height: 100 };
    const bounds = { width: 800, height: 600 };
    const result = clampCropRegion(region, bounds);
    expect(result.x + result.width).toBeLessThanOrEqual(bounds.width);
    expect(result.y + result.height).toBeLessThanOrEqual(bounds.height);
  });

  it("clamps width and height to bounds when larger", () => {
    const region = { x: 0, y: 0, width: 1000, height: 800 };
    const bounds = { width: 800, height: 600 };
    const result = clampCropRegion(region, bounds);
    expect(result.width).toBeLessThanOrEqual(bounds.width);
    expect(result.height).toBeLessThanOrEqual(bounds.height);
  });
});

describe("getCropPixelCoords", () => {
  it("converts viewport coords to image pixel coords accounting for image scale", () => {
    const cropRect = {
      left: 100,
      top: 50,
      width: 200,
      height: 150,
      scaleX: 1,
      scaleY: 1,
    };
    const imageObj = {
      left: 0,
      top: 0,
      scaleX: 2,
      scaleY: 2,
    };
    const result = getCropPixelCoords(cropRect, imageObj);
    // cropRect is at (100, 50) on canvas, image at (0,0) scaled 2x
    // pixel coords: (100-0)/2 = 50, (50-0)/2 = 25
    // pixel size: 200*1/2 = 100, 150*1/2 = 75
    expect(result.x).toBe(50);
    expect(result.y).toBe(25);
    expect(result.width).toBe(100);
    expect(result.height).toBe(75);
  });

  it("accounts for cropRect scale transforms", () => {
    const cropRect = {
      left: 50,
      top: 50,
      width: 100,
      height: 100,
      scaleX: 2,
      scaleY: 1.5,
    };
    const imageObj = {
      left: 0,
      top: 0,
      scaleX: 1,
      scaleY: 1,
    };
    const result = getCropPixelCoords(cropRect, imageObj);
    expect(result.x).toBe(50);
    expect(result.y).toBe(50);
    expect(result.width).toBe(200); // 100 * 2
    expect(result.height).toBe(150); // 100 * 1.5
  });

  it("accounts for image offset position", () => {
    const cropRect = {
      left: 150,
      top: 120,
      width: 100,
      height: 80,
      scaleX: 1,
      scaleY: 1,
    };
    const imageObj = {
      left: 50,
      top: 20,
      scaleX: 1,
      scaleY: 1,
    };
    const result = getCropPixelCoords(cropRect, imageObj);
    expect(result.x).toBe(100); // 150 - 50
    expect(result.y).toBe(100); // 120 - 20
    expect(result.width).toBe(100);
    expect(result.height).toBe(80);
  });
});
