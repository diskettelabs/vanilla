# Error Styling Improvements

## Overview

Updated error messages and notifications to match the application's design system, using consistent colors, spacing, and iconography from the existing UI.

## Changes Made

### 1. Error Messages in Chat

**Updated Design:**
- Background: `var(--panel)` (matches assistant message background)
- Border: `1px solid #f09898` (soft red, not aggressive)
- Padding: `20px` (more breathing room)
- Border radius: `var(--radius)` (8px, consistent with app)

**Error Icon:**
- Now uses `./assets/error.svg` icon (consistent with other UI icons)
- Red color: `#c23b3b` (matches error theme)
- Positioned via CSS `::before` pseudo-element
- Size: `20px × 20px` (consistent with other icons)

**Typography:**
- Error title: Font weight `600`, color `#c23b3b`
- Action text: `0.95em`, `75%` opacity, `1.6` line height
- Maintains readability while showing hierarchy

**Retry Button:**
- Background: `var(--text)` (black/dark theme)
- Text: `var(--bg)` (inverted for contrast)
- Padding: `10px 18px` (comfortable touch target)
- Font weight: `600` (matches other buttons)
- Hover: Slight opacity change + `1px` lift
- Active: Smooth press-down effect

### 2. Toast Notifications

**Container:**
- Position: `24px` from top-right (was `20px`)
- Width: `320px - 480px` (slightly wider)
- Background: `var(--panel)` (consistent)
- Border: `1px solid` with type-specific colors
- Shadow: `var(--shadow)` (matches existing depth system)
- Slide animation: Smooth cubic-bezier easing

**Color System:**
- **Error**: Border `#f09898`, icon color `#c23b3b`
- **Warning**: Border `#f5c563`, icon color `#d97706`
- **Success**: Border `#8dd9a0`, icon color `#059669`
- **Info**: Border `#9cc5f5`, icon color `#2563eb`

**Icons:**
- Error: Uses `./assets/error.svg` icon
- Success: `✓` character in green
- Warning: `!` character in orange
- Info: `i` character in blue
- All icons: `20px × 20px`, centered in flex container

**Typography:**
- Message: `15px`, `font-weight: 500`, `line-height: 1.5`
- Improved readability over previous design

### 3. Model Picker Chevron

**Updated from text to SVG:**
- Before: `<span class="chevron">›</span>` (character)
- After: `<img class="chevron" src="./assets/chevron.svg" alt="">`

**Styling:**
- Size: `16px × 16px`
- Opacity: `0.5` (subtle when idle)
- Hover opacity: `0.7` (slight feedback)
- Rotation: `180deg` when menu is open
- Smooth transitions: `200ms ease`

**Benefits:**
- Consistent with other icon usage
- Better scaling and rendering
- Smooth rotation animation
- Easier to theme/customize

## Design Principles Applied

### Consistency
- Uses existing CSS variables (`--panel`, `--text`, `--bg`, `--line`, `--radius`, `--shadow`)
- Matches padding/spacing patterns from assistant messages
- Icon sizes consistent with toolbar icons (20px)

### Accessibility
- Sufficient color contrast for error states
- Clear visual hierarchy (title → message → action)
- Touch-friendly button sizes (min 44px height)
- Alt text for icons (empty for decorative)

### User Experience
- Soft, approachable error colors (not alarming red)
- Clear visual separation from content
- Smooth animations (300ms transitions)
- Mobile responsive (full width on small screens)

### Visual Hierarchy
1. Error icon + bold title (most prominent)
2. Descriptive error message
3. Actionable guidance (slightly muted)
4. Retry button (clear call-to-action)

## Before vs After

### Error Messages
**Before:**
```
❌ Red-tinted background (rgba with opacity)
❌ Heavy left border (3px solid red)
❌ Emoji icon (⚠️)
❌ Inconsistent with UI theme
```

**After:**
```
✅ Panel background (matches UI)
✅ Subtle border all around
✅ SVG icon (error.svg)
✅ Matches design system
```

### Toast Notifications
**Before:**
```
❌ Smaller (300px min)
❌ Tinted backgrounds (colored transparency)
❌ Emoji icons
❌ Generic spacing
```

**After:**
```
✅ Wider (320-480px)
✅ Clean backgrounds (solid panel)
✅ Type-specific colors on borders only
✅ SVG icons for errors
✅ Consistent spacing
```

### Model Picker
**Before:**
```
❌ Text character chevron (›)
❌ Large font size (30px)
❌ Text color styling
```

**After:**
```
✅ SVG icon (chevron.svg)
✅ Proper size (16px)
✅ Smooth rotation on open
✅ Opacity-based hover state
```

## CSS Variables Used

- `var(--bg)` - Background color
- `var(--panel)` - Panel/card background
- `var(--text)` - Primary text color
- `var(--line)` - Border color
- `var(--radius)` - Border radius (8px)
- `var(--shadow)` - Box shadow
- `var(--font)` - Font family (Satoshi)

## Files Modified

1. `public/styles.css` - Updated error message and notification styles
2. `public/app.js` - Updated showNotification to use error.svg icon
3. `public/index.html` - Changed chevron from text to SVG

## Testing Checklist

- [ ] Error messages display with error.svg icon
- [ ] Error icon is red (#c23b3b)
- [ ] Retry button uses theme colors (dark bg, light text)
- [ ] Toast notifications slide in from right
- [ ] Error toast uses error.svg icon
- [ ] Model picker chevron rotates smoothly
- [ ] Chevron shows on hover with opacity change
- [ ] Mobile: Notifications are full width on small screens
- [ ] All colors match existing UI theme
- [ ] Spacing consistent with assistant messages

## Responsive Behavior

**Desktop (>600px):**
- Notifications: Fixed width (320-480px), positioned top-right
- Error messages: Full width within chat container
- All icons: 20px size maintained

**Mobile (≤600px):**
- Notifications: Full width (left: 12px, right: 12px)
- Error messages: Full width with same padding
- Icons: Same size (no scaling issues)

## Accessibility Notes

- Error icon has empty alt text (decorative, message conveys meaning)
- Chevron has empty alt text (button label provides context)
- Color is not the only indicator (icon shapes differ)
- Retry button has sufficient contrast ratio
- All interactive elements have min 44px touch target
