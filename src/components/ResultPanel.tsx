import { useEffect, useRef, useState } from "react";
import { fmt } from "@/lib/availability";
import type { AvailabilityResult } from "@/lib/availability";
import {
  MockExplanationAdapter,
  explainAvailability,
  createRequestGate,
  DISCLAIMER,
  MOCK_LABEL,
} from "@/lib/explain";
import type { ExplanationMode, ExplanationReasonCode } from "@/lib/explain";
import { CheckCircle2, XCircle, Clock, CalendarX, Sparkles } from "lucide-react";

type Props = {
  result: AvailabilityResult | null;
  range: { start: number; end: number } | null;
  roomLabel: string;
};

const MODE_OPTIONS: { value: ExplanationMode; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "slow", label: "Slow" },
  { value: "error", label: "Error" },
  { value: "no_key", label: "No key" },
];

export function ResultPanel({ result, range, roomLabel }: Props) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explainBusy, setExplainBusy] = useState(false);
  const [mode, setMode] = useState<ExplanationMode>("normal");
  const gate = useRef(createRequestGate());

  // F1: an explanation belongs to a specific result — drop it when the
  // check inputs change, and invalidate any in-flight explain request.
  useEffect(() => {
    gate.current.start();
    setExplanation(null);
  }, [result, range, roomLabel]);

  if (!result || !range) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
        <Clock className="h-8 w-8 text-slate-300 mb-2" />
        <p className="text-sm text-slate-400">
          Pick a room, set the time, and press Check to see availability.
        </p>
      </div>
    );
  }

  const timeLabel = `${fmt(range.start)} – ${fmt(range.end)}`;
  const reasonCode: ExplanationReasonCode = result.available
    ? "available"
    : result.code;

  async function handleExplain() {
    setExplainBusy(true);
    const requestId = gate.current.start();
    const adapter = new MockExplanationAdapter(mode);
    const res = await explainAvailability(adapter, {
      roomLabel,
      start: range!.start,
      end: range!.end,
      isAvailable: result!.available,
      reasonCode,
    });
    // F1 race: if a newer check/explain superseded this one, discard it.
    if (gate.current.isLatest(requestId)) {
      setExplanation(res.explanation);
    }
    setExplainBusy(false);
  }

  return (
    <div className="space-y-3">
      {result.available ? (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-5"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <span className="text-lg font-bold text-emerald-800">Available</span>
          </div>
          <p className="text-sm text-emerald-700">
            The room is free for <span className="font-semibold">{timeLabel}</span> ({range.end - range.start} min).
          </p>
        </div>
      ) : (
        (() => {
          const icon = result.code === "room_blocked" ? CalendarX : XCircle;
          const Icon = icon;
          return (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-xl border border-red-300 bg-red-50 px-5 py-5"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-6 w-6 text-red-600" />
                <span className="text-lg font-bold text-red-800">Unavailable</span>
              </div>
              <p className="text-sm text-red-700">{result.reason}</p>
            </div>
          );
        })()
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <button
          type="button"
          onClick={handleExplain}
          disabled={explainBusy}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          {explainBusy ? "Explaining…" : "Explain availability"}
        </button>
        <label className="inline-flex items-center gap-2 text-xs text-slate-500">
          Mock mode
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as ExplanationMode)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700"
          >
            {MODE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="hidden sm:inline text-slate-400">({MOCK_LABEL})</span>
        </label>
      </div>

      {explanation !== null && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {DISCLAIMER}
          </p>
          <p className="text-sm text-slate-700">{explanation}</p>
        </div>
      )}
    </div>
  );
}
