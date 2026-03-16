# 🎨 Frontend & UI Guidelines

## React & Next.js (App Router)
- **App Router:** Follow Next.js App Router conventions (`app/` directory). Utilize layout patterns (`layout.tsx`), loading states (`loading.tsx`), and error boundaries (`error.tsx`).
- **Server vs Client Components:**
  - Default to Server Components for data fetching and static rendering.
  - Explicitly use `"use client";` at the very top of the file *only* when interactivity (e.g., `useState`, `useEffect`, `onClick`) or browser APIs are required.
- **Data Fetching:** Prefer server-side data fetching directly in Server Components using Convex queries.

## Styling & Tailwind CSS
- **Tailwind v4:** Use Tailwind CSS utility classes for styling. The project uses Tailwind v4 via `@tailwindcss/postcss`.
- **shadcn/ui:** Leverage `shadcn/ui` components located in the project. Use them as the foundation for the UI and customize them via Tailwind classes.
- **Class Merging:** Use `clsx` and `tailwind-merge` (often abstracted via a `cn()` utility) when constructing dynamic class names to avoid specificity conflicts.

## ⚠️ Multi-Language & RTL Development (CRITICAL)
This project uses `next-intl` to manage translations and supports RTL (right-to-left) layouts out-of-the-box (e.g., for Hebrew).
When developing the UI, because Tailwind's standard directional classes do NOT dynamically adapt to RTL document flow, **you must use logical properties**.

- **Margins:** Instead of `ml-*` use `ms-*` (margin-start). Instead of `mr-*` use `me-*` (margin-end).
- **Padding:** Instead of `pl-*` use `ps-*` (padding-start). Instead of `pr-*` use `pe-*` (padding-end).
- **Positioning:** Use `start-*` and `end-*` instead of `left-*` and `right-*`.
- **Borders:** Use `border-s-*` and `border-e-*` instead of `border-l-*` and `border-r-*`.

This ensures spacing will flip automatically based on the `<html dir="...">` attribute set in `app/layout.tsx`. Do not violate this rule.

## Error Handling
- **Graceful Degradation:** Use `error.tsx` files in the Next.js App directory to catch render errors.