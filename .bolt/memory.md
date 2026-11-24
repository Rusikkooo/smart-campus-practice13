# Project memory

## Product intent & audience

- Room availability/booking checker: users query whether a room is available for a given time interval.
- Core domain: validate time inputs, enforce policies, detect overlaps with existing bookings and room blocks.

## Brand personality & voice

- Not yet specified by the user beyond "beautiful, not cookie cutter, production-worthy." Treat UI quality as a hard requirement.

## Visual design & UX direction

- Result UI pattern: single `ResultPanel` component renders Available / Unavailable states with human-readable reason text.
- Tech stack constrains UI: React + Tailwind + Lucide React icons only (no extra UI/icon packages). `@/` path alias for `src/`.
- Aesthetic details not yet inferred; await user design requests.

## Decisions, constraints & rationale

- Stack: Vite + React + TypeScript + Tailwind + Lucide React. Path alias `@/` → `src/`.
- Baseline (all passing): `npm test` (44 tests across 5 files), `npm run typecheck`, `npm run lint`, `npm run build`.
- Test files: `acceptance` (13), `regression` (6), `availability` (15), `policy` (2), `time-rules` (8).
- `AGENTS.md` mandates a review gate before accepting any change — must honor on every edit.
- `src/lib/policy.test.ts` guards against database clients reappearing — do not introduce DB clients.
- For read-only checks, build output can be directed to a temp directory to avoid writing into the project.

## Open questions & assumptions

- Availability logic lives in `src/lib/availability.ts` — `checkAvailability()`; result shown by `src/components/ResultPanel.tsx` (`ResultPanel`).
- Reason codes currently returned (`RejectCode` in `src/lib/availability.ts`): `available`, `invalid_time`, `start_not_after_now`, `duration_exceeded`, `room_blocked`, `overlap`.
- Business rules encoded: max duration 120 min; time must be integer hour within 00:00–24:00; start must be strictly after now; bookings that only touch endpoints are not considered overlapping.
- Repository instructions: `README.md` and `AGENTS.md` (review-gate constraint noted above).
- Exact UI styling, responsive behavior, and accessibility targets not yet explored.