# Mobile Studio Layout Architecture

## User Requirements

**Mobile camera preview**: Always use mobile toggle view as the only view (no desktop toggle option)

## Current State Analysis

The studio currently uses responsive design with `hidden md:` classes, but mobile experience is suboptimal:

### Issues on Mobile:
1. **Right panel dominates** - Chat takes full width, hides camera preview
2. **Control bar overflow** - Many buttons, horizontal scroll required
3. **No mobile navigation** - All tools hidden behind scroll
4. **No bottom navigation** - Must scroll to access important features
5. **Camera preview mode** - Should default to mobile view only

---

## Proposed Mobile Architecture

### Layout Structure (Mobile)

```
┌─────────────────────────────────────┐
│        Header (compact, minimal)    │
├─────────────────────────────────────┤
│                                     │
│    Camera Preview (Mobile View)    │
│    - Always uses mobile aspect      │
│    - No toggle option               │
│                                     │
├─────────────────────────────────────┤
│         Tab Toggle Bar              │
│      [ Chat | QA | Viewers ]        │
├─────────────────────────────────────┤
│         Tab Content Area             │
│    (Chat/QA/Viewers - scrollable)   │
├─────────────────────────────────────┤
│         Bottom Nav Bar              │
│   🎤 Mic | 📹 Cam | ⏺ Live | ⚡     │
└─────────────────────────────────────┘
```

### Bottom Navigation Items (4 essential for mobile):

| Icon | Label | Function | Priority |
|------|-------|----------|----------|
| 🎤 | Mic | Toggle microphone | Critical |
| 📹 | Cam | Toggle camera | Critical |
| ⏺ | Live | Go live / End stream | Critical |
| ⚡ | Deal | Flash deal controls | High |

**Note**: Other features (Filters, Scenes, Sources) accessible via slide-out menu

---

## Key Changes Needed

### 1. Camera Preview - Mobile Only
- Remove preview mode toggle on mobile
- Always use mobile aspect ratio view
- Larger tap targets for mic/cam controls
- Overlay controls on tap

### 2. Mobile Bottom Navigation
- Fixed 4 essential buttons
- Larger touch targets (56px)
- Current state indicators
- Floating above content

### 3. Simplified Tab Navigation
- 3 tabs only: Chat, Q&A, Viewers
- Compact tab bar
- Swipe between tabs

### 4. Slide-out Drawer Menu
- For additional features
- Filters, Scenes, Sources, Settings
- Swipe from right edge or via button

---

## Implementation Phases

### Phase 1: Mobile Camera Preview
- Force mobile view on small screens
- Remove toggle option
- Optimize overlay controls

### Phase 2: Bottom Navigation
- Create MobileBottomNav
- Add to page.tsx (mobile only)
- 4 core buttons

### Phase 3: Layout Restructure
- Stack camera + content vertically
- Toggleable content area
- Full-width on mobile

### Phase 4: Slide-out Menu
- Additional tools drawer
- Accessible from bottom nav

---

## File Changes Required

### New Files:
- `src/app/studio/components/MobileBottomNav.tsx`
- `src/app/studio/components/MobileSlideMenu.tsx`

### Modified Files:
- `src/app/studio/page.tsx` - Add mobile layout
- `src/app/studio/components/StagePreview.tsx` - Mobile-only mode
- `src/app/studio/components/ControlBar.tsx` - Hide on mobile

---

## Responsive Breakpoints

```css
@media (max-width: 767px) {
  /* Mobile layout */
  - MobileBottomNav visible
  - StagePreview always mobile view
  - Single column layout
}

@media (min-width: 768px) {
  /* Desktop layout */
  - Original ControlBar
  - Original layout
}
```

---

## Visual Design Guidelines

### Bottom Nav (Mobile)
- Height: 64px + safe area inset
- Background: Solid with blur
- Icons: 28px with labels
- Active: Orange glow

### Touch Targets
- Minimum 48x48px
- Recommended 56x56px for main actions
- 8px spacing between

### Camera Preview
- 9:16 aspect ratio (mobile)
- Full width, ~55% height
- Controls overlay on tap, fade after 3s
- Live badge always visible top-left

---

## Success Metrics

- [ ] Camera uses mobile view only on mobile
- [ ] 4 essential buttons in bottom nav
- [ ] All features accessible on mobile
- [ ] No horizontal scroll needed
- [ ] Single-hand operation possible
