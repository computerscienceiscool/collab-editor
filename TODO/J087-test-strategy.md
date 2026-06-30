# 087 - Develop unit test strategy for the app

Context:
- We use Vitest + jsdom for UI/unit tests; Playwright already exists for integration/e2e but is heavier.
- Goal: add light unit coverage for UI helpers (e.g., error banner) and editor utilities without relying on browser.

Proposal:
- Location: co-locate Vitest specs next to source files (e.g., `src/ui/errors.test.js`), not `__tests__`.
- Framework/config: reuse existing `vitest` setup; use `jsdom` environment for DOM helpers.
- Targets (initial):
  - Error banner (`src/ui/errors.js`): creation, reuse, timeout hide.
  - Theme toggle helpers: class/variable application.
  - Menu/toggle handlers that mutate DOM (stub DOM nodes, assert class/style changes).
- Patterns:
  - Use `vi.useFakeTimers()` for timeout-driven UI bits.
  - Use simple DOM fixtures via `document.body.innerHTML` in `beforeEach`.
  - Keep tests deterministic; avoid network calls (mock fetch if needed).
- Stretch:
  - Minimal unit tests for GitHub dialogs: ensure status setters/rendering handle errors (mock `showErrorBanner`).
  - Cover Automerge setup helpers with stubs/mocks (no real network).

Open questions:
- Do we want a dedicated test folder (`tests/unit/ui/`) instead of co-location?
- Do we enforce coverage thresholds (e.g., add to `npm run test:coverage`)?
