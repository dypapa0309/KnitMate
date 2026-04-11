# KnitMate Design System

## Visual Theme & Atmosphere
- Apple-inspired premium utility app with calm warmth.
- Spacious layout, restrained motion, clear hierarchy.
- Bright base surfaces with subtle mirrored-glass accents on navigation and launcher UI.
- The app should feel tactile and polished, not decorative or neon.

## Color Palette & Roles
- `Background`: `#F7F3EE`
- `Surface`: `#FFFDFC`
- `Surface Muted`: `#F1E7DC`
- `Text`: `#2A241F`
- `Text Muted`: `#75685D`
- `Border`: `#E4D8CB`
- `Primary`: `#A46A54`
- `Primary Soft`: `#EFD9CB`
- `Glass Tint`: `rgba(255, 255, 255, 0.55)`
- `Glass Stroke`: `rgba(255, 255, 255, 0.42)`
- `Glass Shadow`: `rgba(42, 36, 31, 0.08)`

## Typography Rules
- Prefer SF Pro style system typography.
- Use large, quiet headings with strong spacing rather than dense stacks.
- Page titles should feel premium and editorial, but body text should stay highly readable.
- Avoid overly playful or bubbly type treatments.

## Component Styling
- Cards:
  - Rounded and soft.
  - Thin border first, shadow second.
  - Use solid surfaces for content-heavy areas.
- Navigation bar / tab bar:
  - Main place to use mirrored-glass treatment.
  - Semi-transparent, softly blurred, with a crisp upper border.
- Floating `+` launcher:
  - Feels like a polished glass control.
  - Slight depth, subtle highlight, no loud glow.
- Buttons:
  - Primary buttons stay warm and solid.
  - Secondary controls can use translucent glass or muted fills.
- Timeline items:
  - Structured and readable first.
  - Let photos and notes breathe with generous padding.

## Layout Principles
- First tab is always `뜨개방`.
- Prioritize breathing room over maximum information density.
- Keep top-level pages simple: one hero heading, one primary cluster, then content sections.
- Use glass treatment sparingly:
  - tab bar
  - launcher
  - select overlays
- Do not use glass styling on every card.

## Depth & Elevation
- Solid content cards: low elevation.
- Glass controls: medium elevation with soft shadow and highlight.
- Avoid hard black shadows or thick borders.

## Do's and Don'ts
- Do keep the app calm, premium, and warm.
- Do make local knitting workflow feel dependable and grounded.
- Do use translucent UI only where it improves navigation focus.
- Don't turn content feeds into flashy glass panels.
- Don't use purple neon gradients or generic glassmorphism everywhere.
- Don't sacrifice readability for effect.

## Responsive Behavior
- Phone-first layout.
- Ensure the tab bar and launcher stay comfortable on iPhone widths.
- Keep tap targets generous.
- Preserve the same visual language on Android, but prefer native-feeling stability over exact visual parity.

## Product Intent Notes
- `뜨개방` is the default landing tab and should feel the most stable and practical.
- SNS areas (`피드`, `뜨모저모`, `프로필`) may feel slightly lighter and more polished, but must still match the same warm Apple-inspired system.
- The UI should communicate: reliable crafting workspace first, premium social layer second.
