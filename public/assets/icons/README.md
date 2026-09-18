# Vanilla icon set

These are the editable master assets used by the app. Every SVG uses a 24 × 24 viewBox and is rendered as a CSS mask, so black fills and strokes automatically inherit the current theme color.

## Drawing rules

- Work on a 24 × 24 px artboard with a 3 px optical margin.
- Use 2 px centered strokes with round caps and joins.
- Prefer simple geometry and rounded corners over small decorative detail.
- Use solid black only. Do not add backgrounds, shadows, gradients, or opacity.
- Keep strokes editable when exporting from Sketch.
- Test at 14, 16, 18, and 20 px before replacing the file.

## Shared masters

Some UI names intentionally point to the same SVG in `../../icons.js`:

- `arrow-left`, `arrow-right`, and `arrow-up` use `arrow-up.svg` with rotation.
- `chevron-left`, `chevron-right`, and `chevron-down` use `chevron-right.svg` with rotation.
- `panel-left-open` and `panel-left-close` use `sidebar.svg` with mirroring.
- `pencil` and `pencil-line` share the same underlying pencil geometry.
- `message`, `message-more`, `new-chat`, and the animated Vanilla mascot should feel like one family.

The original icon language is the reference: compact, geometric, friendly, and slightly heavier than a standard outline set.
