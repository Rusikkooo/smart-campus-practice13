# Smart Campus Room Availability Checker

Myrzabayev Ruslan · Software Engineering · 24 Oct 2026

One responsive page that **checks** whether a room is free (it never creates or changes bookings).
Fictional in-memory data only — no login, database, backend, external API or payments.

- **Live demo:** https://smart-campus-room-av-t4ai.bolt.host
- **Bolt.new project:** https://bolt.new/~/sb1-19meynjz

## Repository contents

| Path | What |
|---|---|
| `src/` | Prototype source (React + TypeScript + Tailwind, generated with Bolt.new and cleaned up) |
| `src/lib/availability.ts` | Pure rule `checkAvailability()` (AC1–AC5) |
| `src/lib/availability.test.ts`, `src/lib/regression.test.ts`, `src/lib/time-rules.test.ts`, `src/lib/acceptance.test.ts`, `src/lib/policy.test.ts` | Vitest test files (see AGENTS.md; run `npm test` for current counts) |
| `docs/A3_Myrzabayev_Ruslan_Report.pdf` | Historical — Report: scope, criteria, traceability, tests, issues, agent analysis, reflection |
| `docs/AI_Evidence.pdf` | Historical — Appendix: prompts/responses, tool/model/date, screenshots, source checks |
| `python/` | Historical — `booking.py`, `test_booking.py`, first AI version `v1/booking.py`, raw test logs; reference copy, not part of the web build |
| `screenshots/main/` | Historical — A3 project: v1, before/after for each fix, final tests, mobile, demo |
| `screenshots/practice6_project/` | Historical — Earlier Practice 6 attempt (history) |
| `diagrams/` | Agent-loop diagram (`.mmd` source + `.png`) |

## Run

```bash
npm install
npm test
npm run typecheck
npm run lint
npm run build
npm run dev
```

Agents: read and follow `AGENTS.md` before changing anything in this repository.

```bash
cd python
python3 -m unittest -v test_booking                    # final -> 21/21
BOOKING_IMPL=v1 python3 -m unittest -v test_booking    # AI v1 -> 20/21 (T20 fails)
```

## Acceptance criteria

AC1 integer minutes, 0 ≤ start < end ≤ 1440, start strictly after now · AC2 ≤ 120 min (120 allowed) ·
AC3 blocked room always rejected · AC4 no overlap, touching endpoints allowed ·
AC5 unambiguous Available/Unavailable, bookings never mutated · AC6 clear feedback, mobile layout.
