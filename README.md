# handoff.

**old tech, new homes.** A free tech giveaway platform — list your unwanted gadgets, chat with claimants in realtime, and hand them off via pickup or post.

## Stack

- **Frontend:** Vite + React + TypeScript, hand-rolled CSS (Space Grotesk, electric blue `#2b4bff`)
- **Backend:** Supabase (project ref `zxwcbctqsvxkdouqldmr`, eu-west-2) — Postgres + RLS, Auth, Realtime, Storage

## Run it

```bash
npm install
npm run dev
```

Environment lives in `.env.local` (Supabase URL + publishable key — safe for the client; all security is enforced server-side by RLS).

## Features

- **Public catalogue** — browse without an account; category filters + search
- **Listings** — photo upload, category, honest condition scale (`like-new` → `mysterious`), general location area
- **Realtime chat** — two-way messaging via Supabase Realtime, image uploads to a private bucket (signed URLs, participants only)
- **Handoff flow** (enforced by Postgres functions, not just UI):
  - Giver picks **pickup** → must set a location tag
  - Giver picks **post** → an address request is sent; receiver submits a delivery address (stored on the conversation row, visible only to the two participants, never in chat)
  - **"handoff confirmed"** button (giver only) unlocks once the requirements are met; marks the listing handed off

## Security model

- RLS on every table; conversations/messages readable only by the two participants
- Chat images live in a **private** bucket with per-conversation folder policies
- Handoff state changes go through `SECURITY DEFINER` RPCs (`set_delivery_method`, `submit_delivery_address`, `confirm_handoff`) with role + precondition checks; anon execution revoked
- Storage upload paths are folder-scoped to the uploader / conversation

## Testing

```bash
node scripts/e2e-chat-test.mjs
```

Runs 25 checks: sign-in, conversation creation, realtime delivery, image upload + signed URL access, outsider-access denial, and the full handoff state machine (happy path plus every forbidden transition). Uses the seeded test accounts `giver@test.handoff.local` / `receiver@test.handoff.local` (password `handoff-test-1234`).

> Note: after a run the test conversation is left confirmed; reset by deleting the test receiver's conversations and setting the test giver's listing back to `available`.

## Demo data

Seeded users `dave_cables`, `retro_rita`, `gadget_gran` own the sample listings. They can't log in (random passwords).
