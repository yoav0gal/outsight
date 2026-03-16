# 🎨 Frontend & UI Guidelines

## React & Next.js (App Router)
- **App Router:** Follow Next.js App Router conventions (`app/` directory). Utilize layout patterns (`layout.tsx`), loading states (`loading.tsx`), and error boundaries (`error.tsx`).
- **Server vs Client Components:**
  - Default to Server Components for data fetching and static rendering.
  - Explicitly use `"use client";` at the very top of the file *only* when interactivity (e.g., `useState`, `useEffect`, `onClick`) or browser APIs are required.
- **Data Fetching:** Prefer server-side data fetching directly in Server Components using Convex queries.

## Styling & Tailwind CSS
- **Tailwind v4:** Use Tailwind CSS utility classes for styling. The project uses Tailwind v4 via `@tailwindcss/postcss`.
- **shadcn/ui:** Leverage `shadcn/ui` components located in `components/ui/`. Use them as the foundation for the UI and customize them via Tailwind classes.
- **Class Merging:** Use `clsx` and `tailwind-merge` (often abstracted via a `cn()` utility) when constructing dynamic class names to avoid specificity conflicts.

## ⚠️ Multi-Language & RTL Development (CRITICAL)
This project uses `next-intl` to manage translations and supports RTL (right-to-left) layouts out-of-the-box (e.g., for Hebrew).

### Logical Properties vs. Physical Properties
Tailwind's standard directional classes do NOT dynamically adapt to RTL document flow. **You must use logical properties** to ensure the layout flips correctly.

| Physical (Never Use) | Logical (Always Use) | Description |
| :--- | :--- | :--- |
| `ml-*`, `mr-*` | `ms-*`, `me-*` | Margin Start / End |
| `pl-*`, `pr-*` | `ps-*`, `pe-*` | Padding Start / End |
| `left-*`, `right-*` | `start-*`, `end-*` | Absolute Positioning |
| `border-l-*`, `border-r-*` | `border-s-*`, `border-e-*` | Border Start / End |
| `text-left`, `text-right` | `text-start`, `text-end` | Text Alignment |
| `rounded-l-*`, `rounded-r-*` | `rounded-s-*`, `rounded-e-*` | Border Radius |

### Directional Icons
Icons that indicate direction (arrows, chevrons) must be flipped in RTL:
- Use `rtl:rotate-180` to flip icons like `ArrowRight` or `ChevronRight`.
- For icons that shouldn't flip (like a clock or a checkmark), keep them as is.

### Animations
Use logical animation utilities:
- Use `slide-in-from-start` instead of `slide-in-from-left`.
- Use `slide-in-from-end` instead of `slide-in-from-right`.

This ensures spacing and layout will flip automatically based on the `<html dir="...">` attribute set in `app/layout.tsx`. Do not violate this rule.

## Error Handling
- **Graceful Degradation:** Use `error.tsx` files in the Next.js App directory to catch render errors.