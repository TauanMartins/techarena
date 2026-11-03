import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FormEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import { LeagueCreatePanel } from "./LeagueCreatePanel";

describe("LeagueCreatePanel", () => {
  it("submits league details and reflects the saving state", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) => event.preventDefault());
    const { rerender } = render(<LeagueCreatePanel sports={[{ id: "sport-1", name: "Futebol", defaultPlayers: 11 }]} saving={false} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("Nome"), "Liga de verão");
    await user.selectOptions(screen.getByLabelText("Modalidade"), "sport-1");
    await user.click(screen.getByRole("button", { name: "Criar liga" }));
    expect(onSubmit).toHaveBeenCalled();

    rerender(<LeagueCreatePanel sports={[]} saving onSubmit={onSubmit} />);
    expect(screen.getByRole("button", { name: "Salvando..." })).toBeDisabled();
  });
});
