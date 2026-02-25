import { useState } from "react";
import { supabase } from "../lib/supabase";
import { usePlayers } from "../hooks/usePlayers";
import { useIceEvents } from "../hooks/useIceEvents";
import { useIceScores } from "../hooks/useIceScores";
import { PlayerPicker } from "../components/PlayerPicker";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );
  if (seconds < 60) return "nå";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m siden`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}t siden`;
  const days = Math.floor(hours / 24);
  return `${days}d siden`;
}

export function IcePage() {
  const { players, loading: playersLoading } = usePlayers();
  const { events, loading: eventsLoading } = useIceEvents();
  const scores = useIceScores(players, events);

  const [placerId, setPlacerId] = useState("");
  const [victimId, setVictimId] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const playerMap = new Map(players.map((p) => [p.id, p.name]));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!placerId || !victimId || placerId === victimId) return;
    setSubmitting(true);
    await supabase.from("ice_events").insert({
      placer_id: placerId,
      victim_id: victimId,
      comment: comment.trim() || null,
    });
    setComment("");
    setSubmitting(false);
  }

  if (playersLoading || eventsLoading) {
    return <p className="text-center text-gray-500">Laster...</p>;
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <h1 className="text-center text-2xl font-bold text-amber-400">
        Smirnoff ICE
      </h1>

      {/* Scoreboard */}
      <section className="rounded-xl bg-gray-900 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Poengtavle
        </h2>
        <div className="flex flex-col gap-2">
          {scores.map((s, i) => (
            <div
              key={s.player.id}
              className="flex items-center justify-between rounded-lg bg-gray-800 px-3 py-2"
            >
              <span className="flex items-center gap-2">
                <span className="text-sm text-gray-500">#{i + 1}</span>
                <span className="font-medium">{s.player.name}</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-xs text-green-400">+{s.placed}</span>
                <span className="text-xs text-red-400">-{s.received}</span>
                <span
                  className={`min-w-[2rem] text-right font-bold ${
                    s.score > 0
                      ? "text-green-400"
                      : s.score < 0
                        ? "text-red-400"
                        : "text-gray-400"
                  }`}
                >
                  {s.score}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Log icing form */}
      <section className="rounded-xl bg-gray-900 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Registrer icing
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <PlayerPicker
            label="Icer (den som legger)"
            players={players}
            value={placerId}
            onChange={setPlacerId}
            excludeId={victimId}
          />
          <PlayerPicker
            label="Offer (den som drikker)"
            players={players}
            value={victimId}
            onChange={setVictimId}
            excludeId={placerId}
          />
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-300">
            Kommentar (valgfritt)
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="F.eks. gjemt i sekken..."
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 placeholder:text-gray-600"
            />
          </label>
          <button
            type="submit"
            disabled={!placerId || !victimId || placerId === victimId || submitting}
            className="rounded-lg bg-amber-500 py-2.5 font-semibold text-gray-950 transition-colors hover:bg-amber-400 disabled:opacity-40"
          >
            {submitting ? "Sender..." : "Registrer"}
          </button>
        </form>
      </section>

      {/* Event feed */}
      <section className="rounded-xl bg-gray-900 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Siste hendelser
        </h2>
        {events.length === 0 ? (
          <p className="text-center text-sm text-gray-500">
            Ingen icinger ennå. Vær den første!
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {events.slice(0, 20).map((ev) => (
              <div
                key={ev.id}
                className="flex flex-col rounded-lg bg-gray-800 px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    <span className="font-semibold text-green-400">
                      {playerMap.get(ev.placer_id) ?? "?"}
                    </span>
                    {" ➜ "}
                    <span className="font-semibold text-red-400">
                      {playerMap.get(ev.victim_id) ?? "?"}
                    </span>
                  </span>
                  <span className="text-xs text-gray-500">
                    {timeAgo(ev.created_at)}
                  </span>
                </div>
                {ev.comment && (
                  <p className="mt-0.5 text-xs text-gray-400 italic">
                    {ev.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
