import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../shared/api";
import type { TeamOverview } from "./TeamDetailsModal";
import { useTeamsData } from "./useTeamsData";

vi.mock("../../shared/api", () => ({
  api: {
    listTeams: vi.fn(),
    listMyTeams: vi.fn(),
    listMyTeamRequests: vi.fn(),
    listTeamMembers: vi.fn(),
    listTeamRequests: vi.fn(),
    searchUsers: vi.fn(),
  },
}));

describe("useTeamsData", () => {
  const emptyPage = {
    items: [],
    total: 0,
    totalPages: 0,
    page: 1,
    limit: 20,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads team catalog and user data, and enables captain-only details", async () => {
    vi.mocked(api.listTeams).mockResolvedValue(emptyPage);
    vi.mocked(api.listMyTeams).mockResolvedValue(emptyPage);
    vi.mocked(api.listMyTeamRequests).mockResolvedValue(emptyPage);
    vi.mocked(api.listTeamMembers).mockResolvedValue(emptyPage);
    vi.mocked(api.listTeamRequests).mockResolvedValue(emptyPage);
    vi.mocked(api.searchUsers).mockResolvedValue(emptyPage);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);
    const team: TeamOverview = {
      id: "team-1",
      name: "Equipe",
      description: null,
      image: null,
      role: "captain",
    };

    const { result } = renderHook(
      () =>
        useTeamsData({
          token: "access-token",
          userId: "user-1",
          catalogSearch: "atletas",
          selectedTeam: team,
          inviteSearch: "ana",
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isLoadingDetails).toBe(false);
    });
    expect(api.listTeams).toHaveBeenCalledWith("access-token", "atletas");
    expect(api.listTeamMembers).toHaveBeenCalledWith("access-token", "team-1");
    expect(api.listTeamRequests).toHaveBeenCalledWith("access-token", "team-1");
    expect(api.searchUsers).toHaveBeenCalledWith("access-token", "ana");

    queryClient.clear();
  });
});
