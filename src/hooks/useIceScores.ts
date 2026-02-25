import { useMemo } from "react";
import type { IceEvent, Player } from "../types/database";

export interface PlayerScore {
  player: Player;
  placed: number;
  received: number;
  score: number;
}

export function useIceScores(players: Player[], events: IceEvent[]): PlayerScore[] {
  return useMemo(() => {
    const placed = new Map<string, number>();
    const received = new Map<string, number>();

    for (const e of events) {
      placed.set(e.placer_id, (placed.get(e.placer_id) ?? 0) + 1);
      received.set(e.victim_id, (received.get(e.victim_id) ?? 0) + 1);
    }

    return players
      .map((player) => {
        const p = placed.get(player.id) ?? 0;
        const r = received.get(player.id) ?? 0;
        return { player, placed: p, received: r, score: p - r };
      })
      .sort((a, b) => b.score - a.score);
  }, [players, events]);
}
