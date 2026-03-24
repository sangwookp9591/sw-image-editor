import { describe, it, expect } from "vitest";
import { calculateResize } from "./resize-utils";

describe("calculateResize", () => {
  it("scales height proportionally when width changes with locked aspect ratio", () => {
    const result = calculateResize({ width: 1920, height: 1080 }, "width", 960, true);
    expect(result).toEqual({ width: 960, height: 540 });
  });

  it("scales width proportionally when height changes with locked aspect ratio", () => {
    const result = calculateResize({ width: 1920, height: 1080 }, "height", 540, true);
    expect(result).toEqual({ width: 960, height: 540 });
  });

  it("only changes width when unlocked", () => {
    const result = calculateResize({ width: 1920, height: 1080 }, "width", 500, false);
    expect(result).toEqual({ width: 500, height: 1080 });
  });

  it("clamps zero to minimum 1px", () => {
    const result = calculateResize({ width: 100, height: 100 }, "width", 0, true);
    expect(result).toEqual({ width: 1, height: 1 });
  });

  it("clamps negative values to minimum 1px", () => {
    const result = calculateResize({ width: 1920, height: 1080 }, "width", -100, true);
    expect(result).toEqual({ width: 1, height: 1 });
  });
});
