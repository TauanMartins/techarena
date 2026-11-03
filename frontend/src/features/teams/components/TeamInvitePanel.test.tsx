import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TeamInvitePanel } from "./TeamInvitePanel";

describe("TeamInvitePanel", () => {
  it("filters unavailable invite actions and handles search and membership decisions", async () => {
    const user = userEvent.setup();
    const onInvite = vi.fn();
    const onDecideRequest = vi.fn();
    const request = { id: "request-1", teamId: "team-1", teamName: "Equipe", userId: "athlete-4", userName: "Caio", createdBy: "captain", kind: "request" as const, status: "pending" as const, createdAt: "2026-01-01" };
    render(<TeamInvitePanel
      members={[{ id: "athlete-1", name: "Ana", username: null, image: null, role: "member", joinedAt: null }]}
      requests={[request, { ...request, id: "invite-1", userId: "athlete-3", kind: "invitation" }]}
      candidates={[
        { id: "athlete-1", name: "Ana", username: null, image: null },
        { id: "athlete-3", name: "Bia", username: "bia", image: null },
        { id: "athlete-2", name: "Duda", username: null, image: null },
      ]}
      search="du" invitingUserId="athlete-2" onSearchChange={vi.fn()} onSearchSubmit={vi.fn()} onInvite={onInvite} onDecideRequest={onDecideRequest}
    />);

    expect(screen.getByRole("button", { name: "Já participa" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Convite pendente" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Convidando..." })).toBeDisabled();
    await user.type(screen.getByLabelText("Buscar atleta para convidar"), "da");
    expect(screen.getByRole("button", { name: "Buscar" })).toBeInTheDocument();
    fireEvent.submit(screen.getByRole("button", { name: "Buscar" }).closest("form")!);
    await user.click(screen.getByRole("button", { name: "Aceitar" }));
    await user.click(screen.getByRole("button", { name: "Recusar" }));
    expect(onDecideRequest).toHaveBeenNthCalledWith(1, request, "accept");
    expect(onDecideRequest).toHaveBeenNthCalledWith(2, request, "decline");
    expect(onInvite).not.toHaveBeenCalled();
  });
});
