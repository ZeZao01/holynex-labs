import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ADMIN_MENU_ROUTES, ADMIN_ROUTE_LABELS, ADMIN_SECONDARY_ROUTES } from "@/lib/admin-routes";

const srcRoot = resolve(process.cwd(), "src");
const appSource = readFileSync(resolve(srcRoot, "App.tsx"), "utf8");
const sidebarSource = readFileSync(resolve(srcRoot, "components/AdminSidebar.tsx"), "utf8");

describe("admin navigation contract", () => {
  it("registers and labels every sidebar menu route", () => {
    expect(new Set(ADMIN_MENU_ROUTES).size).toBe(ADMIN_MENU_ROUTES.length);

    for (const route of ADMIN_MENU_ROUTES) {
      expect(appSource, `${route} is missing from App routes`).toContain(`path="${route}"`);
      expect(sidebarSource, `${route} is missing from the sidebar`).toContain(`url: "${route}"`);
      expect(ADMIN_ROUTE_LABELS[route], `${route} has no header label`).toBeTruthy();
    }
  });

  it("registers every Brand Studio secondary route", () => {
    for (const route of ADMIN_SECONDARY_ROUTES) {
      expect(appSource, `${route} is missing from App routes`).toContain(`path="${route}"`);
      expect(ADMIN_ROUTE_LABELS[route], `${route} has no header label`).toBeTruthy();
    }
  });
});
