import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useContext } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../lib/api-client";
import { renderWithProviders } from "../test/test-utils";
import { AuthContext } from "./AuthContext";
import { AuthProvider } from "./AuthProvider";

const authState = vi.hoisted(() => ({
  listener: null as ((event: string, session: unknown) => void) | null,
  getSession: vi.fn(),
  signOut: vi.fn(),
  unsubscribe: vi.fn(),
}));
vi.mock("../lib/supabase-client", () => ({
  isSupabaseConfigured: true,
  supabase: { auth: {
    getSession: authState.getSession,
    signOut: authState.signOut,
    signInWithOAuth: vi.fn(),
    onAuthStateChange: (listener: (event: string, session: unknown) => void) => {
      authState.listener = listener;
      return { data: { subscription: { unsubscribe: authState.unsubscribe } } };
    },
  } },
}));

function AuthProbe() {
  const auth = useContext(AuthContext)!;
  return <div>
    <span>{auth.loading ? "Carregando sessão" : auth.session ? "Sessão carregada" : "Deslogado"}</span>
    {auth.authError && <span role="alert">{auth.authError}</span>}
    <button onClick={() => void auth.logout()}>Sair da conta</button>
  </div>;
}

const profile = { id: "user-1", name: "Ana", username: "ana", image: null, permission: null, email: "ana@example.com", birthDate: null, gender: null, createdAt: "2026-01-01" };
const session = { access_token: "token", user: { id: "user-1", email: "ana@example.com" } };

describe("AuthProvider", () => {
  beforeEach(() => {
    authState.listener = null;
    authState.getSession.mockResolvedValue({ data: { session: null }, error: null });
    authState.signOut.mockResolvedValue({ error: null });
    vi.spyOn(api, "getProfile").mockResolvedValue(profile as never);
  });
  afterEach(() => vi.restoreAllMocks());

  it("restores an anonymous session, follows sign-in and sign-out events, and unsubscribes", async () => {
    const user = userEvent.setup();
    const view = renderWithProviders(<AuthProvider><AuthProbe /></AuthProvider>);
    expect(await screen.findByText("Deslogado")).toBeInTheDocument();

    authState.listener?.("SIGNED_IN", session);
    expect(await screen.findByText("Sessão carregada")).toBeInTheDocument();
    await waitFor(() => expect(api.getProfile).toHaveBeenCalledWith("token"));
    await user.click(screen.getByRole("button", { name: "Sair da conta" }));
    expect(authState.signOut).toHaveBeenCalledOnce();

    authState.listener?.("SIGNED_OUT", null);
    expect(await screen.findByText("Deslogado")).toBeInTheDocument();
    view.unmount();
    expect(authState.unsubscribe).toHaveBeenCalledOnce();
  });

  it("reports a failed session restore without leaving the loading state stuck", async () => {
    authState.getSession.mockRejectedValueOnce(new Error("auth offline"));
    renderWithProviders(<AuthProvider><AuthProbe /></AuthProvider>);
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível restaurar seu acesso");
    expect(screen.getByText("Deslogado")).toBeInTheDocument();
  });
});
