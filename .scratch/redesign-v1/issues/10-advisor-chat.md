# Slice 10: AdvisorChat restyle

Status: ready-for-agent

## Parent

[`../PRD.md`](../PRD.md)

## What to build

Restyle the floating `AdvisorChat` component (bottom-right fixed position, 24px from edges) to match the new design language. No functional changes to the chat behavior, message handling, model routing, or system prompts.

## Acceptance criteria

- [ ] Floating chat button uses new accent color and shadow tokens
- [ ] Open chat panel uses new modal/overlay treatment (background, padding, radii, shadow)
- [ ] Message bubbles and input field follow new token system
- [ ] Position and trigger behavior unchanged (fixed bottom-right, click to open/close)
- [ ] Chat continues to function identically to today (send messages, receive responses)
- [ ] Visible on Vercel preview

## Blocked by

- [`01-design-tokens.md`](./01-design-tokens.md)
