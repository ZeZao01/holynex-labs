import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("responsive application shell", () => {
  it("clips horizontal overflow created by reveal and marquee animations", () => {
    const styles = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");

    expect(styles).toMatch(/html,\s*body,\s*#root\s*\{[^}]*overflow-x:\s*clip;/s);
  });
});
