import { useEffect, useMemo, useState } from "react";
import { SAMPLE_ROOMS } from "@/data/rooms";
import { checkAvailability, fmt, MAX_DURATION_MIN } from "@/lib/availability";
import type { AvailabilityResult, Room } from "@/lib/availability";
import { applyBlocked, buildValidationErrors, parseDuration } from "@/lib/request";
import { RoomPicker, ExistingBookings } from "@/components/RoomPicker";
import { TimeSelect } from "@/components/TimeSelect";
import { ResultPanel } from "@/components/ResultPanel";
import { Clock, Search, Building2, ToggleLeft, ToggleRight } from "lucide-react";

const DEFAULT_NOW = 570; // 09:30
const DEFAULT_START = 585; // 09:45

export default function App() {
  const [roomId, setRoomId] = useState<string>(SAMPLE_ROOMS[0].id);
  const [now, setNow] = useState<number>(DEFAULT_NOW);
  const [start, setStart] = useState<number>(DEFAULT_START);
  const [duration, setDuration] = useState<string>("60");
  const [blockedToggle, setBlockedToggle] = useState<boolean>(false);
  const [result, setResult] = useState<AvailabilityResult | null>(null);

  const room: Room = useMemo(
    () => SAMPLE_ROOMS.find((r) => r.id === roomId) ?? SAMPLE_ROOMS[0],
    [roomId]
  );

  const durationState = useMemo(() => parseDuration(duration), [duration]);
  const end = durationState.ok ? start + durationState.value : null;

  // Clear any previous result whenever any input changes, so the displayed
  // result always belongs to the current inputs (not a stale green panel).
  useEffect(() => {
    setResult(null);
  }, [roomId, now, start, duration, blockedToggle]);

  const validationErrors = useMemo(
    () => buildValidationErrors(duration, now, start),
    [duration, now, start]
  );

  function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!durationState.ok || end === null) return;
    const res = checkAvailability({
      now,
      start,
      end,
      room: applyBlocked(room, blockedToggle),
    });
    setResult(res);
  }

  function resetDemo() {
    setRoomId(SAMPLE_ROOMS[0].id);
    setNow(DEFAULT_NOW);
    setStart(DEFAULT_START);
    setDuration("60");
    setBlockedToggle(false);
    setResult(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">
              Smart Campus Room Availability Checker
            </h1>
            <p className="text-xs text-slate-500">
              Check whether a room is free — no booking is created.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        {/* Room selection */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
          <RoomPicker rooms={SAMPLE_ROOMS} selectedId={roomId} onSelect={setRoomId} />
        </section>

        {/* Existing bookings for the selected room */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">
            Existing bookings
          </h2>
          <ExistingBookings room={room} />
        </section>

        {/* Time + check form */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-700">
            <Clock className="h-4 w-4" />
            <h2 className="text-sm font-semibold">Set times</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <TimeSelect
              label="Simulated now"
              value={now}
              onChange={setNow}
              help="Pretend this is the current time."
            />
            <TimeSelect
              label="Start"
              value={start}
              onChange={setStart}
            />
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="duration-input"
                className="text-sm font-semibold text-slate-700"
              >
                Duration (minutes)
              </label>
              <input
                id="duration-input"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_DURATION_MIN}
                step={1}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                aria-invalid={!durationState.ok}
                className={`rounded-lg border px-3 py-2.5 text-slate-800 outline-none focus:ring-1 ${
                  durationState.ok
                    ? "border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    : "border-red-400 focus:border-red-500 focus:ring-red-500"
                }`}
              />
            </div>
          </div>

          {/* Blocked toggle (AC3 demo): passes a copy with blocked = true. */}
          <label className="inline-flex items-center gap-2 text-sm text-slate-700 select-none">
            <input
              type="checkbox"
              checked={blockedToggle}
              onChange={(e) => setBlockedToggle(e.target.checked)}
              className="accent-blue-600"
            />
            {blockedToggle ? (
              <ToggleRight className="h-4 w-4 text-blue-600" />
            ) : (
              <ToggleLeft className="h-4 w-4 text-slate-400" />
            )}
            Room status: blocked
          </label>

          {/* Live preview + validation */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 space-y-1 text-sm">
            <p className="text-slate-600">
              Checking: <span className="font-medium text-slate-800">{room.name}</span>
              {blockedToggle && (
                <span className="ml-2 text-xs font-semibold text-red-600">(toggled blocked)</span>
              )}
            </p>
            <p className="text-slate-600">
              Requested slot:{" "}
              <span className="font-mono font-medium text-slate-800">
                {fmt(start)}
                {end !== null ? ` – ${fmt(end)}` : ""}
              </span>{" "}
              <span className="text-slate-400">
                (end = start + duration; {end !== null ? `${end - start} min` : "duration invalid"})
              </span>
            </p>
            {validationErrors.length > 0 && (
              <ul className="mt-1 list-disc pl-5 text-red-600 text-xs space-y-0.5">
                {validationErrors.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleCheck}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-white font-semibold transition-colors hover:bg-blue-700"
            >
              <Search className="h-4 w-4" />
              Check availability
            </button>
            <button
              type="button"
              onClick={resetDemo}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-700 font-medium hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </section>

        {/* Result */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
          <ResultPanel
            result={result}
            range={result && end !== null ? { start, end } : null}
            roomLabel={room.name}
          />
        </section>

        <footer className="text-center text-xs text-slate-400 pb-6">
          Prototype · Fictional sample data · Availability check only — no bookings are created or changed.
        </footer>
      </main>
    </div>
  );
}
