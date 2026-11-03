import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ThemeContext } from "../ThemeContext";
import { useThemePreference } from "./useThemePreference";

describe("useThemePreference", () => {
  it("requires the theme provider", () => {
    expect(() => renderHook(() => useThemePreference())).toThrow("deve ser usado dentro de ThemeProvider");
  });

  it("returns the active theme context", () => {
    const value = { theme: "dark" as const, error: null, reloadTheme: vi.fn(), saveTheme: vi.fn() };
    const wrapper = ({ children }: { children: ReactNode }) => <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
    const { result } = renderHook(() => useThemePreference(), { wrapper });
    expect(result.current).toBe(value);
  });
});
