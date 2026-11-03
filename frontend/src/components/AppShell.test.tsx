import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../test/test-utils";
import { AppShell } from "./AppShell";

const authState = vi.hoisted(() => ({
  value: {
    profile: { id: "user-1", name: "Ana Silva", username: "ana", image: null },
    session: { user: { email: "ana@example.com" } },
    logout: vi.fn(), profileError: null as string | null, refreshProfile: vi.fn(),
  } as any,
}));
vi.mock("../auth/useAuth", () => ({ useAuth: () => authState.value }));

afterEach(() => vi.clearAllMocks());

describe("AppShell", () => {
  it("renders the main navigation and expands community destinations", () => {
    renderWithProviders(<AppShell />, { initialEntries: ["/chat/team/1"] });
    expect(screen.getByRole("navigation", { name: "Navegação principal" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Início" })).toBeInTheDocument();
    expect(screen.getByText("Ana Silva")).toBeInTheDocument();
    const communityToggle = screen.getByRole("button", { name: /Comunidades/ });
    expect(communityToggle).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(communityToggle);
    expect(communityToggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("TechArena · esporte é melhor em equipe")).toBeInTheDocument();
  });

  it("offers profile recovery and logout when the profile is unavailable", async () => {
    authState.value = { ...authState.value, profile: null, profileError: "profile unavailable" };
    authState.value.logout.mockRejectedValueOnce(new Error("logout failed"));
    renderWithProviders(<AppShell />);
    expect(screen.getByRole("heading", { name: "Não foi possível carregar seu perfil" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    fireEvent.click(screen.getByRole("button", { name: "Sair" }));
    expect(await screen.findByText("logout failed")).toBeInTheDocument();
    expect(authState.value.refreshProfile).toHaveBeenCalledOnce();
    expect(authState.value.logout).toHaveBeenCalledOnce();
  });
});
