import { buildConversations } from "./conversation.types";
import type { FriendGroups } from "../../../shared/types";
import { describe, expect, it } from "vitest";

const emptyPage = {
  total: 0,
  totalPages: 0,
  page: 1,
  limit: 50,
  hasNextPage: false,
  hasPreviousPage: false,
};

describe("buildConversations", () => {
  it("maps friends, teams, and appointments to the shared conversation shape", () => {
    const friends: FriendGroups = {
      friends: {
        ...emptyPage,
        items: [
          {
            id: "friendship-1",
            status: "accepted",
            user: {
              id: "user-1",
              name: null,
              username: "atleta",
              image: null,
            },
          },
        ],
      },
      requestedFriends: { ...emptyPage, items: [] },
      receivedFriends: { ...emptyPage, items: [] },
    };

    expect(
      buildConversations(
        friends,
        [
          {
            id: "team-1",
            name: "Equipe",
            description: null,
            image: null,
            joinedAt: null,
            role: "captain",
          },
        ],
        [
          {
            id: "appointment-1",
            title: "Treino",
            description: null,
            scheduledAt: "2026-10-30T20:00:00.000Z",
            status: "scheduled",
            organizerId: "user-1",
            isOrganizer: true,
            maxPlayers: null,
            holder: true,
          },
        ],
      ),
    ).toEqual([
      {
        id: "user-1",
        kind: "direct",
        label: "atleta",
        otherUserId: "user-1",
        username: "atleta",
        image: null,
        detail: "Amizade",
      },
      {
        id: "team-1",
        kind: "team",
        label: "Equipe",
        image: null,
        description: null,
        role: "captain",
        detail: "Equipe",
      },
      {
        id: "appointment-1",
        kind: "appointment",
        label: "Treino",
        description: null,
        scheduledAt: "2026-10-30T20:00:00.000Z",
        status: "scheduled",
        detail: new Date("2026-10-30T20:00:00.000Z").toLocaleDateString(
          "pt-BR",
        ),
      },
    ]);
  });
});
