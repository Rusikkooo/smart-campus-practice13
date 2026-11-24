# AGENTS.md

## Project
Smart Campus room availability checker. A student picks a room and a time interval and gets a clear Available / Unavailable answer. Fictional data only.

## Structure
- src/lib/availability.ts: pure booking rules (checkAvailability)
- src/App.tsx and src/components/: UI only
- src/data/rooms.ts: fixture data (SAMPLE_ROOMS)
- src/lib/availability.test.ts, src/lib/regression.test.ts, src/lib/time-rules.test.ts, src/lib/acceptance.test.ts: tests
- python/: historical reference copy, not part of the web build

## Accepted rules (AC1-AC6)
- AC1: 0 <= start < end <= 1440 and start strictly after current time.
- AC2: reject durations over 120 minutes; exactly 120 is allowed.
- AC3: reject a blocked room.
- AC4: reject overlaps; bookings touching only at endpoints are allowed.
- AC5: clear Available / Unavailable answer; never mutate booking data.
- AC6: usable at desktop and narrow/mobile width with understandable feedback.

## Constraints
Preserve AC1-AC6. Fictional rooms only, defined in src/data/rooms.ts; do not add rooms or real data. No backend, login, database or saved booking creation. No new dependencies. Do not change UI layout or visible messages unless asked.

## Forbidden actions
- Never publish or deploy the app; only the human owner publishes manually after review.
- Never add secrets, API keys or .env values; never commit or paste credential material.
- Never add new dependencies, database clients or backend calls.
- Never delete or weaken existing test assertions.
- Never edit files outside the agreed task scope.

## Review gate
Before acceptance: report the diff and the output of npm test, npm run typecheck, npm run lint and npm run build, then wait for explicit human approval. Do not treat a green run alone as acceptance.

## Engineering rules
Prefer pure functions and minimal changes; use at most 2 justified patterns. Do not add Singleton, Factory or class hierarchies without a concrete need. Do not mutate booking fixtures; keep responsive UI feedback. Do not weaken or delete existing test assertions.

## Commands
- npm test (runs vitest run)
- npm run typecheck
- npm run lint
- npm run build

## Verification
Run existing tests before proposing acceptance and add focused regression tests.
Report changed files, rationale and test evidence.
Follow the Review gate section before claiming acceptance.
