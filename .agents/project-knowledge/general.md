# 📖 General Project Guidelines

## Project Overview & Tech Stack
This is a modern web application built with the following core technologies:
- **Framework:** Next.js (App Router, v16.1.6)
- **Library:** React (v19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (v4), shadcn/ui
- **Backend/Database:** Convex
- **Authentication:** WorkOS (AuthKit)
- **Internationalization (i18n):** `next-intl`
- **Icons:** Phosphor Icons, Hugeicons, Lucide React

## TypeScript & General Conventions
- **Strict Typing:** Always use TypeScript. Avoid `any`. Use `unknown` if the type is truly uncertain, and perform necessary type narrowing.
- **Interfaces vs Types:** Use `type` for unions and primitives. Use `interface` for object shapes and class structures.
- **Path Aliases:** Use the configured path alias `@/` for absolute imports (e.g., `import { Button } from "@/components/ui/button"`). Do not use deep relative paths (like `../../../`).

## File Naming
- Components, contexts, and hooks: `camelCase` or `PascalCase` as appropriate (e.g., `useUser.ts`, `Button.tsx`).
- Next.js specific files: `page.tsx`, `layout.tsx`, `route.ts`.

## Authentication (WorkOS)
- **AuthKit:** Authentication is handled by `@workos-inc/authkit-nextjs`.
- **Session Management:** Rely on WorkOS hooks/utilities to retrieve session data, user profiles, and manage login/logout flows. Do not implement custom JWT handling unless explicitly required.