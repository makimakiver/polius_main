# Pollius Lite — 3D + Wallet Page

**Date:** 2026-05-31
**Status:** Approved design

## Goal

Build a fresh, minimal web page in `/Users/makimakiver/polius_main` that borrows the
visual identity of the existing `pollius_oss` app but contains only two things: an
animated Three.js scene and a Sui wallet connect button. No economic simulation,
no stats/history/event panels, no play/beat controls.

## Reference

`/Users/makimakiver/pollius_oss` — a Vite + TypeScript app (vanilla TS with one React
island for the wallet). This project lifts and trims its toolchain, wallet island,
3D helpers, and CSS tokens.

## Toolchain

Same as `pollius_oss`:

- Vite 7 + TypeScript, ES2022 target.
- Vanilla-TS application with a single React island for the wallet UI
  (`@mysten/dapp-kit` is React-only).
- Dependencies: `three`, `@mysten/dapp-kit`, `@mysten/sui`,
  `@tanstack/react-query`, `react`, `react-dom`.
- Dev deps: `typescript`, `vite`, `vitest`, `@types/three`, `@types/react`,
  `@types/react-dom`.

The Tauri layer from `pollius_oss` is **not** carried over — this is web-only.

## File layout

```
polius_main/
  index.html              # mounts /src/main.ts into <main id="app">
  package.json
  tsconfig.json
  vite.config.ts          # vitest config; node test environment
  src/
    main.ts               # builds the shell once, mounts scene + wallet
    scene3d.ts            # PolliusScene: trimmed Three.js centerpiece
    wallet.tsx            # Sui ConnectButton island (≈ verbatim from oss)
    styles.css            # trimmed style tokens + shell/wallet/frame layout
    shortAddress.test.ts  # unit test for address formatting
```

## Components

### `src/main.ts`

- Builds the static shell HTML **once** (no per-tick re-render).
- Mounts `PolliusScene` into the `.map-frame` host element.
- Mounts the wallet React island into `#wallet`.
- Bridges the connected account back to the vanilla app via an `onAccountChange`
  callback that updates `#wallet-status` text. Reuses the original's
  `shortAddress(address)` helper (`0x1234…abcd` form).
- Exports `shortAddress` (or imports it from a small shared module) so it is unit
  testable.
- Wires a sidebar toggle button (`#sidebar-toggle`) that flips an
  `is-collapsed` class on `.shell` — a ChatGPT-style hide/show. The toggle button
  lives in the workspace header so it stays reachable when the sidebar is hidden.
  The collapsed state is persisted to `localStorage` (`pollius:sidebar`) and
  restored on load.

### `src/scene3d.ts` — `PolliusScene`

A slimmed version of `PolliusWorld3D` from `world3d.ts`, with **no** `WorldState`
or `simulation` import. Keeps:

- `WebGLRenderer` (antialias, alpha, ACES tone mapping), perspective camera,
  `THREE.Clock`, `ResizeObserver`.
- Sky background texture and lighting (hemisphere + warm directional sun + cool
  fill), lifted from the original's `makeSkyTexture` / `buildLighting`.
- A single slowly-rotating `IcosahedronGeometry` centerpiece with an additive
  glow-sprite halo (reuse `makeGlowTexture` / `makeGlowSprite`).
- An upward-drifting additive `ParticleField` (trimmed from the original).
- Auto-orbit camera with damping plus pointer drag-to-look controls
  (reuse `bindPointerControls` + the orbit/elevation damping in `start()`).
- `start()` runs the RAF loop; `destroy()` cancels RAF, aborts pointer listeners,
  disconnects the observer, disposes geometries/materials/textures, and clears the
  host.
- Honors `prefers-reduced-motion` via the same `motion` multiplier.

Dropped from the original: terrain mesh, water bodies, agent orbs, service pylons,
ripple/arc/burst pools, vitality logic, zoom levels, grass texture.

### `src/wallet.tsx`

Copied essentially verbatim from `pollius_oss/src/wallet.tsx`:
`QueryClientProvider` → `SuiClientProvider` (testnet/mainnet/devnet config,
default testnet) → `WalletProvider autoConnect` → `AccountBridge` rendering
`<ConnectButton />` and reporting the address via `onAccount`. Returns a teardown
function. Imports `@mysten/dapp-kit/dist/index.css`.

### `src/styles.css`

Trimmed copy of the original tokens and layout:

- `:root` color tokens (paper/surface/ink/muted/line/gold/blue/etc.) and base font.
- `body` grid-paper background.
- `.shell` two-column grid, `.sidebar`, `.eyebrow`, `h1/h2`, `.summary`.
- `.wallet-box`, `#wallet button`, `.wallet-status`.
- `.workspace`, the dark `.map-frame` (radial gradients + inset shadows) and
  `.world-3d` canvas sizing / grab cursor.
- Collapsible sidebar: `.shell.is-collapsed` switches the grid to a single
  column and hides `.sidebar` (with a short width/opacity transition); a
  `#sidebar-toggle` button styled to sit in the workspace header.
- Mobile (`max-width: 860px`) and `prefers-reduced-motion` media queries.

Dropped: `.toolbar`/`.controls`/`.heartbeat`, `.grid` multi-panel layout,
`.metrics`, `.agent-*`, `.chip*`, `.history`, `.log`, zoom controls, map legend.

## Layout

Same two-column shell as the original:

- **Sidebar (collapsible):** eyebrow "OSS Terrarium", `h1` "Pollius", a short
  English tagline (e.g. "A living world you grow, then let go."), and the wallet
  box (label, `#wallet` connect button, `#wallet-status` line — "Not connected" →
  "Connected · 0x1234…abcd"). Hidden/shown via the header toggle, ChatGPT-style.
- **Workspace:** a header row holding the `#sidebar-toggle` button, and below it a
  single dark `.map-frame` panel filling the area, containing the `.world-3d`
  canvas host.

No play/beat/reset/speed controls, no stats/history/event panels, no zoom buttons
or legend. Sidebar text is English (the original's Japanese tagline is dropped).

## Data flow

```
React wallet island ──(onAccount: address|null)──▶ onAccountChange()
                                                      └─▶ #wallet-status text
PolliusScene ── self-contained ── independent of wallet state
```

## Error handling

- `main.ts` throws if `#app` root is missing (matches original).
- Scene host / wallet host lookups are guarded; if absent, the corresponding mount
  is skipped rather than crashing the page.

## Testing

- Vitest with `environment: "node"` as in the original.
- Unit test for `shortAddress` formatting (start/end slice, expected `…` join).
- The 3D and visual surface is verified by running `npm run dev` and observing the
  page (canvas renders, orbit animates, wallet button connects/updates status).

## Out of scope

- The economic simulation (`core/simulation.ts`) and all sim-driven UI.
- Tauri / desktop packaging.
- Deploy/"World Bundle" minting flow.
