# Layout Glitch Fix

## Problem
When typing in the textarea, the entire omnibar UI was shifting and glitching.

## Root Cause
The initial implementation used `display: contents` on `.input-wrapper`, which made its children participate directly in the grid. This caused layout recalculation and shifting when the textarea height changed.

## Solution
Changed `.input-wrapper` to be a proper flex container that occupies a single grid cell:

```css
.input-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 36px;
}
```

### How It Works

#### Collapsed State
```
Grid Layout:
┌────────┬──────────────────┬────────┐
│ Plus   │  Input Wrapper   │ Submit │
│  36px  │   flexible       │  36px  │
└────────┴──────────────────┴────────┘
```

#### Expanded State
```
Grid Layout:
┌───────────────────────────────┬────────┐
│  Input Wrapper                │        │
│  ┌─────────────────────────┐  │        │
│  │ Attachment Preview      │  │        │
│  │ (if present)            │  │        │
│  ├─────────────────────────┤  │        │
│  │ Textarea                │  │        │
│  │ (grows with content)    │  │        │
│  └─────────────────────────┘  │        │
├───────────────────────────────┼────────┤
│  Tools                        │ Submit │
└───────────────────────────────┴────────┘
```

### Key Points

1. **Single Grid Cell**: `.input-wrapper` occupies one grid cell
2. **Flex Column**: Children stack vertically inside
3. **No Grid Changes**: Grid structure stays constant
4. **Height Auto**: Flex layout handles height naturally
5. **No Shifts**: Content flows smoothly without jumps

### CSS Changes

```css
/* Fixed wrapper */
.input-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 36px;
}

/* Preview inside wrapper */
.attachment-preview {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 0 8px 0;
}

/* Textarea inside wrapper */
#promptInput {
  width: 100%;
  min-height: 36px;
  /* No grid positioning needed */
}

/* Wrapper takes full width when expanded */
.omnibar[data-expanded="true"] .input-wrapper {
  grid-column: 1 / 3;
  grid-row: 1;
}
```

## Testing
1. Open app at http://localhost:3000
2. Click + to expand omnibar
3. Start typing - no glitches!
4. Attach a file - preview appears smoothly
5. Continue typing - layout stays stable
6. Remove attachment - no shift

## Result
✅ No more UI shifting
✅ Smooth typing experience
✅ Stable layout transitions
✅ Attachment preview integrates cleanly
