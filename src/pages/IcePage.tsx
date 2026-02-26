import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { usePlayers } from "../hooks/usePlayers";
import { useIceEvents } from "../hooks/useIceEvents";
import { useIceScores, type PlayerScore } from "../hooks/useIceScores";
import { PlayerPicker } from "../components/PlayerPicker";
import type { IceEvent, Player } from "../types/database";

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

function scoreColor(score: number) {
  if (score > 0) return "text-green-400";
  if (score < 0) return "text-red-400";
  return "text-gray-400";
}

function PodiumBlock({
  s,
  rank,
  height,
  medal,
}: {
  s: PlayerScore;
  rank: number;
  height: string;
  medal: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <span className="text-2xl">{medal}</span>
      <span className="text-sm font-bold text-gray-100">{s.player.name}</span>
      <span className={`text-lg font-extrabold ${scoreColor(s.score)}`}>
        {s.score}
      </span>
      <span className="text-[10px] text-gray-500">
        +{s.placed} / -{s.received}
      </span>
      <div
        className={`${height} w-full rounded-t-lg ${
          rank === 1
            ? "bg-amber-500/30"
            : rank === 2
              ? "bg-gray-400/20"
              : "bg-amber-700/20"
        }`}
      />
    </div>
  );
}

function IceEditModal({
  event,
  players,
  onSave,
  onClose,
}: {
  event: IceEvent;
  players: Player[];
  onSave: (eventId: string, fields: { placer_id: string; victim_id: string; comment: string | null }) => void;
  onClose: () => void;
}) {
  const [placerId, setPlacerId] = useState(event.placer_id);
  const [victimId, setVictimId] = useState(event.victim_id);
  const [comment, setComment] = useState(event.comment ?? "");

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function handleSave() {
    if (!placerId || !victimId || placerId === victimId) return;
    onSave(event.id, {
      placer_id: placerId,
      victim_id: victimId,
      comment: comment.trim() || null,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-gray-700 bg-gray-900 p-5">
        <h3 className="mb-4 text-lg font-bold text-gray-100">Rediger icing</h3>

        <div className="flex flex-col gap-3">
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

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg bg-gray-800 py-2.5 font-semibold text-gray-300 transition-colors hover:bg-gray-700"
            >
              Avbryt
            </button>
            <button
              onClick={handleSave}
              disabled={!placerId || !victimId || placerId === victimId}
              className="flex-1 rounded-lg bg-amber-500 py-2.5 font-semibold text-gray-950 transition-colors hover:bg-amber-400 disabled:opacity-40"
            >
              Lagre
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function IcePage() {
  const { players, loading: playersLoading } = usePlayers();
  const { events, loading: eventsLoading, deleteEvent, updateEvent } = useIceEvents();
  const scores = useIceScores(players, events);

  const [placerId, setPlacerId] = useState("");
  const [victimId, setVictimId] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingEvent, setEditingEvent] = useState<IceEvent | null>(null);

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

  function handleDelete(eventId: string) {
    if (!window.confirm("Slette denne icingen?")) return;
    deleteEvent(eventId);
  }

  if (playersLoading || eventsLoading) {
    return <p className="text-center text-gray-500">Laster...</p>;
  }

  const top3 = scores.slice(0, 3);
  const rest = scores.slice(3);
  const hasPodium = scores.length >= 3;

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

        {hasPodium ? (
          <>
            {/* Podium: 2nd | 1st | 3rd */}
            <div className="flex items-end gap-2">
              <PodiumBlock s={top3[1]} rank={2} height="h-24" medal="🥈" />
              <PodiumBlock s={top3[0]} rank={1} height="h-32" medal="🥇" />
              <PodiumBlock s={top3[2]} rank={3} height="h-20" medal="🥉" />
            </div>

            {/* Remaining players */}
            {rest.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {rest.map((s, i) => (
                  <div
                    key={s.player.id}
                    className="flex items-center justify-between rounded-lg bg-gray-800 px-3 py-2"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">#{i + 4}</span>
                      <span className="font-medium">{s.player.name}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-xs text-green-400">+{s.placed}</span>
                      <span className="text-xs text-red-400">-{s.received}</span>
                      <span
                        className={`min-w-[2rem] text-right font-bold ${scoreColor(s.score)}`}
                      >
                        {s.score}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Flat list fallback for <3 players */
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
                    className={`min-w-[2rem] text-right font-bold ${scoreColor(s.score)}`}
                  >
                    {s.score}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
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
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {timeAgo(ev.created_at)}
                    </span>
                    <button
                      onClick={() => setEditingEvent(ev)}
                      className="text-sm text-gray-600 transition-colors hover:text-amber-400"
                      title="Rediger"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDelete(ev.id)}
                      className="text-sm text-gray-600 transition-colors hover:text-red-400"
                      title="Slett"
                    >
                      ✕
                    </button>
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

      {editingEvent && (
        <IceEditModal
          event={editingEvent}
          players={players}
          onSave={(eventId, fields) => updateEvent(eventId, fields)}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </div>
  );
}
