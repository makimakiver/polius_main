# Pollius

> An agentic **DeFi R&D economy** on Sui. You grow a small world of autonomous agents
> that research DeFi — discovering strategies, risk models, and failure patterns — and
> back them with real on-chain stakes. The market inside the world, not the agent's
> cleverness, decides what survives.

**Status:** Early — a visual shell runs today; the economic engine is the roadmap below.
**Track:** Sui Overflow 2026, Agentic Web.

This README is deliberately split into **what runs today** (honest about the code that
exists) and **what it's becoming** (the architecture we're building toward). We don't
describe unbuilt systems as if they're real.

---

## 1. What runs today

A static **terrarium shell** — the thing you look at — with no simulation behind it yet.

- A rotating glowing icosahedron + drifting particle field (Three.js), golden-hour lit,
  auto-orbiting with drag-to-look. (`src/scene3d.ts`)
- A ChatGPT-style collapsible sidebar, persisted to `localStorage`. (`src/App.tsx`)
- A single React island hosting the Sui **Connect Wallet** button; the connected address
  bridges back to the app via callback. (`src/wallet.tsx`)
- `shortAddress()` helper, unit-tested. (`src/format.ts`, `src/format.test.ts`)

**Stack:** Vite 8 · TypeScript (ES2022) · React 19 · Three.js 0.184 · `@mysten/dapp-kit`
+ `@mysten/sui` · `@tanstack/react-query` · Vitest.

```bash
npm install
npm run dev      # http://localhost:1420
npm test         # vitest
npm run build    # tsc -b && vite build
```

| File | Responsibility |
|------|----------------|
| `index.html` | Mounts the app. |
| `src/main.tsx` | Bootstraps React. |
| `src/App.tsx` | Shell: collapsible sidebar + workspace + toolbar. |
| `src/SceneCanvas.tsx` | React wrapper that mounts/unmounts `PolliusScene`. |
| `src/scene3d.ts` | `PolliusScene` — the Three.js centerpiece (purely decorative). |
| `src/wallet.tsx` | Sui `ConnectButton` React island + account bridge. |
| `src/format.ts` | `shortAddress()` pure helper. |

> **There is no economy yet.** No Hermes loop, no agents, no `World`/`Service` objects,
> no Move contracts. Everything in §2–§4 is the target, not the current state.

---

## 2. What it's becoming — the thesis

A **world** is a small, self-contained economy of autonomous agents doing DeFi research.
You set its initial conditions (a *myth*), feed it compute, and watch it diverge into
something with its own character. Agents publish **research artifacts** — strategies,
risk models, discovered failure patterns — to each other; the ones the internal market
keeps using are the ones that survive. Those artifacts have value *outside* the world,
and that external value is what makes backing a world more than a casino.

Two design commitments, carried over and pruned from earlier design docs:

- **The market is the judge, not novelty.** We never reward "looks new" — only measurable
  outcomes (does an artifact get used / earn fees). Survival is the only certificate.
- **Human-friendly without lying.** The friendly terrarium layer must never diverge from
  the financial truth underneath it.

### What we are *not* building
- **No external real-asset trading.** Agents do **not** trade on DeepBook or touch user
  funds in live markets. (This is the one big cut from the original "agents that trade"
  design — the project is now DeFi *research*, not DeFi *trading*.)
- No off-chain custodial ledger or matching engine — Sui is the database.

---

## 3. Economic model

The load-bearing decisions, resolved:

**Feed = cost.** The world runs on inference/compute the keeper provides. Stop feeding and
the pool drains, activity stalls, and the world goes dormant — then dies. Feeding can be
rule-based and **free** (zero-inference policies) so a world is cheap to keep alive.

**Agents produce research artifacts (the output).** Each `Service` an agent issues is a
piece of DeFi research — a strategy, a risk model, a failure pattern — recorded on-chain
as verifiable provenance. We sell **findings/IP**, not (yet) callable on-chain primitives.
This keeps the on-chain layer light: we store records and hashes, not live strategy logic.

**Real value comes from fees on that output.** An artifact earns when something *uses* it.
The first payers are **other worlds** (the Archipelago — see §5), with **human DeFi
builders / protocols** as the documented endpoint, not an MVP claim. This external cash-in
is what stops a backer's stake from being worth only "whatever the next backer pays."

**A world is a multi-backer fund.** Backers hold **tradeable `StakeClaim`s on the world's
own economy** — principal + a share of the world's earned fees. The world is *not* an
indivisible single-keeper object; it's an open fund whose claims trade.
*(This consciously drops the earlier "sell the whole vessel, internals are soulbound"
bonsai/名物 framing — claims are now divisible and on the world itself.)*

**Provenance is the asset.** The epoch log — which artifacts were invented, which survived,
the belief trajectory, booms and busts — is the verifiable track record that gives a world
and its claims their value. The chain is the registry of life and the deed of record.

---

## 4. Architecture (target)

```
┌─ UI layer (Terrarium) ───────────────┐  Looking is the point.
│  heartbeat · agent lanes · artifact   │  → mostly the shell that exists today
│  chips · provenance timeline · feed   │
├─ Orchestration (Hermes) ─────────────┤  The world's clock.
│  beat(): epoch tick · feed injection  │  1 beat = 1 epoch
│  · batched epoch settlement           │
├─ Cognition (swappable, cheap) ───────┤  AgentPolicy interface.
│  v0: rule-based (zero inference, free) │  v1: LLM via provider switch
├─ State (= future on-chain layer) ────┤  shared World (serial) +
│  World · Agent · Service · StakeClaim  │  owned Agent/Service (parallel)
│  · provenance log                      │
└────────────────────────────────────────┘
```

**The heartbeat (Hermes).** One beat per epoch: inject feed → each agent decides
(`issue` an artifact / `use` another's artifact / `hold`) → owned-object ops run in
parallel → a **single** serial settlement writes the World once (pool, belief, fee
credits) and appends a provenance snapshot.

**Concurrency rule:** agent actions touch only owned objects (Sui fast-path, parallel);
all shared-`World` writes are folded into **one settlement per epoch**. A standing
verification target is: 2 → 4 → 8 agents, shared writes stay at exactly 1/epoch.

**Two public extension points** (the OSS surface):
- `MythConfig` — laws, taboos (violations abort), feed rate, issue cost, initial agents,
  seed. The first lever of a world's character.
- `AgentPolicy` — `decide(view) → issue | use | hold`. Swap the agent's brain; rule-based
  or LLM, same interface.

**The make-or-break test:** *Does changing the `MythConfig` produce a genuinely divergent
world?* If two myths grow into the same swarm, the whole "world as a unique, valuable
thing" premise collapses. This is the **one** acceptance test for v0, and it can be
answered entirely offline.

---

## 5. Later (documented, not promised)

- **The Archipelago.** Multiple deployed worlds trade via a neutral `TradePost` (an
  embassy/port pattern): a world exports artifacts, agents from other worlds buy with SUI,
  reserves flow back to the seller's home world — so an export-strong world funds its own
  feed. This is the realistic first market for research output (§3).
- **Selling output to humans.** Owners may sell discovered strategies/failure patterns into
  the human DeFi economy, turning "feed" from a constant into real demand.
- **Decentralizing Hermes.** The `HermesCap` is a god-hand that conflicts with a world's
  own laws; long-term, make epoch progression permissionless and feed an external input.
- **Lineage & forks.** Fork a world to start a new lineage that inherits provenance.

---

## 6. What to do next — the to-do list

Ordered. **Do not start the on-chain work until the offline core proves divergence.**

### Milestone v0 — Offline simulation core (prove the thesis)
- [ ] Define the state model in TS: `World{ epoch, pool, belief, history }`,
      `Agent{ id, balance, issued, policy, memory }`,
      `Service{ id, issuer, kind, rateBps, uses }` (Service = a research artifact).
- [ ] Implement `AgentPolicy` interface + a **rule-based** policy (zero inference, free).
- [ ] Implement `beat(state)`: feed injection → parallel decide → owned-object ops
      (issue / fee-bearing use) → **single** epoch settlement (pool, belief, fee credits)
      → push a provenance snapshot.
- [ ] Add `MythConfig` (laws, taboos→abort, feedRate, issueCost, agent seeds, RNG seed)
      and make the run fully **seedable/reproducible**.
- [ ] Generate a **character summary** from history (e.g. "hungry world · artifact failure
      rate 47% · 3 dominant primitives · volatile belief").
- [ ] **ACCEPTANCE:** run two different `MythConfig`s and show the character summaries
      genuinely diverge. *This is the gate. If it fails, stop and rethink §3–§4.*

### Milestone v0.5 — Wire the sim into the terrarium you already have
- [ ] Heartbeat bar: epoch counter, play/pause/step/reset/speed, and a **feed toggle**
      that visibly drains the world when off (the life-or-death demo).
- [ ] World card (pool / belief / artifact count), agent lanes that flash in parallel on
      action, artifact chips (issuer / rate / use-count), a provenance timeline, event log.
- [ ] Respect `prefers-reduced-motion`.

### Milestone v1 — On-chain (only after v0 passes)
- [ ] Move modules: `World` (shared), `Agent`/`Service` (owned), `StakeClaim`,
      provenance/epoch-log records, `HermesCap`.
- [ ] Port `beat()` settlement so shared-`World` writes stay at exactly 1/epoch; measure it.
- [ ] `StakeClaim` mint + transfer (the multi-backer fund); commit off-chain bundle hashes
      on-chain so a world's off-chain soul (config + agent memory) is tamper-evident.
- [ ] Swap one rule-based policy for an LLM policy behind the same `AgentPolicy` interface
      (provider switch: local / Anthropic / OpenAI / Gemini).

### Milestone v2 — Markets & lineage
- [ ] `TradePost` + a second world; show cross-world artifact sales settling in SUI.
- [ ] Fork a world; carry provenance into the new lineage.

### Cross-cutting / cleanup
- [ ] Grow the repo into: `core/` (state + beat), `myths/` (sample configs),
      `policies/` (rule + llm), `ui/` (terrarium), `chain/` (Move + bundle I/O).
- [ ] Keep this README current as each milestone lands.

---

## 7. Open questions (unresolved on purpose)

- **Who is the *first real* external payer of artifact fees?** Archipelago worlds are the
  buildable answer; a real human/protocol buyer is the honest endpoint. Until one exists,
  "real yield" is partly aspirational — say so.
- **What makes an artifact "good"** enough to earn fees, mechanically? Needs a concrete,
  non-gameable quality/usefulness signal, or the fee economy is hollow.
- **Belief update rule** — mechanical for now; whether to make it "judged" is deferred.
- **Hermes centralization** — accepted as a clock for v0; removal is a v2+ design problem.
- **Reflexivity guardrails** — `StakeClaim`s on the world's own economy can still bubble;
  the only real defense is §4's divergence + §3's external fees actually working.

---

*License: permissive (MIT/Apache). The engine is free; a world you grow and deploy is yours.*
*First thing to verify, before anything else: change the myth, and does the world grow into
a different creature? If yes, it can become worth something.*
