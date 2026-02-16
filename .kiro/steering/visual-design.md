# Visual Design & Aesthetic Principles

**Record PWA** — calm, unobtrusive, content-focused visual language for personal journaling.

---

## Core Philosophy

**Calm & Contemplative**: Muted teal-gray colors, generous whitespace, soft shadows (`--shadow-sm`), slow transitions (150-250ms). No bright colors or aggressive UI.

**Content Over Chrome**: Large serif text for entries (18-20px), small muted UI controls, minimal decoration. Clear hierarchy: content > metadata > controls.

**Low Friction, Low Pressure**: Calm empty states ("No entries yet" not "Start your journey!"), neutral feedback, verbs not imperatives ("New Entry" not "Start Writing!").

---

## Typography Patterns

**Content (Priority #1)**:

- Font: `--font-family-serif` (Georgia, Iowan Old Style)
- Size: `--font-size-lg` (18px) desktop, `--font-size-base` (16px) mobile
- Line height: `--line-height-relaxed` (1.75)
- Color: `--color-text-primary` (high contrast)

**Metadata (Priority #2)**:

- Font: `--font-family-sans` (system fonts)
- Size: `--font-size-sm` (14px)
- Color: `--color-text-secondary` (muted gray)

**UI Controls (Priority #3)**:

- Font: `--font-family-sans`, `--font-size-base` (16px)
- Medium weight for buttons

---

## Color Usage

**Primary (`--color-primary` teal-gray #5a8a94)**:

- CTAs: "New Entry", "Save" buttons
- Focus states on inputs
- Active navigation indicators

**Secondary (`--color-text-secondary` gray)**:

- Metadata (timestamps, update indicators)
- Secondary buttons ("Cancel", "Edit")
- Placeholder text

**Danger (`--color-danger` red)**:

- Destructive actions only ("Delete", "Discard")
- Error messages and validation

**Rule**: Never use color as sole indicator (accessibility). Avoid bright accents (disrupts calm aesthetic).

---

## Spacing & Rhythm

**Scale**:

- Micro (4-8px): Component internals, icon gaps
- Small (12-16px): Related elements (button + icon)
- Medium (24-32px): Unrelated elements (entry cards)
- Large (48-64px): Major page sections

**Key Principles**:

- Entries separated by `--spacing-8` (32px minimum)
- Internal card padding: `--spacing-5` (20px) desktop, `--spacing-4` (16px) mobile
- Consistent 4px multiples (`--spacing-*`)
- Reduce scale ~20% on mobile

---

## Component Patterns

### Entry Cards

- Background: `--color-surface` (white), shadow: `--shadow-sm`
- Padding: `--spacing-5` (desktop), `--spacing-4` (mobile)
- Border radius: `--radius-md` (8px)
- Content: Serif, large, no borders
- Metadata: Sans-serif, small, muted, below content with `--spacing-3` gap
- Edit button: Desktop hover-reveal, mobile always visible (44x44px)

### Day Navigation

- Layout: `[← Prev] [Current Date] [Next →]` horizontal flexbox
- Date: Sans-serif, `--font-size-xl`, `--font-weight-semibold`
- Buttons: Icon-only (← →), `--color-text-secondary`, 44x44px touch targets
- Optional: Sticky positioning for mobile

### Create Form

- Inline (always visible, not modal)
- Textarea: Sans-serif, `--font-size-base`, calm placeholder
- Save button: Primary style, below textarea with `--spacing-3` gap
- No borders unless focused

---

## Interaction States

**Buttons**:

- Primary: `--color-primary` bg, white text → hover: `--color-primary-hover` → active: `--color-primary-active`
- Secondary/Ghost: Transparent bg, `--color-text-secondary` → hover: `--color-background`
- Focus: Visible ring (`--color-focus-ring`, 3px, 2px offset)
- Disabled: 50% opacity

**Inputs**:

- Default: `--color-border` (1px)
- Focus: `--color-border-focus` (2px, teal-gray), no box-shadow
- Error: `--color-error` border (2px), error text below

**Read vs Edit Mode**:

- Read: Subtle shadow, serif text, no borders, hover reveals Edit button
- Edit: Visible border (`2px solid var(--color-border-focus)`), sans-serif, Save/Cancel buttons prominent
- Principle: Viewing passive, editing active. Never ambiguous.

---

## Responsive Behavior

**Mobile (320-767px)**:

- Single column layout, full-width cards
- Visible action buttons (no hover-reveal)
- Entry content: `--font-size-base` (16px)
- Touch targets: 44x44px minimum
- Condensed spacing (`--spacing-6` between entries)

**Desktop (1024px+)**:

- Centered content area (max-width 800px)
- Generous whitespace on sides
- Hover interactions enabled
- Entry content: `--font-size-lg` (18px)

---

## Accessibility

**Contrast**: 4.5:1 for text (WCAG AA), 3:1 for large text (18px+) and UI controls.

**Focus Indicators**: All interactive elements must have visible focus (`3px solid var(--color-focus-ring)` with `2px` offset). Never `outline: none` without replacement.

**Motion**: Respect `prefers-reduced-motion`. Transitions: 150-250ms, ease-out for entrances, ease-in for exits. No endless loops.

---

## Implementation Checklist

- [ ] Content uses serif font at `--font-size-lg`+
- [ ] UI controls use sans-serif, muted colors
- [ ] Whitespace between elements ≥ `--spacing-8` (32px)
- [ ] Entry cards have `--shadow-sm` elevation
- [ ] Buttons have visible focus rings
- [ ] Read/edit modes visually distinct
- [ ] Mobile touch targets ≥ 44x44px
- [ ] Color contrast meets WCAG AA
- [ ] Transitions respect `prefers-reduced-motion`
- [ ] No hardcoded colors (all use CSS variables)

---

_created: 2026-02-09_
_status: Active steering (applies to all features)_
