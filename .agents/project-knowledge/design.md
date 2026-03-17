# 🎨 Design & UI Guidelines

## General Aesthetic & Theme
This application is designed for both medical practitioners and patients. It must feel professional, calming, accessible, and highly polished.
- **Colors:** Use soft, calming colors. Neutral backgrounds (like `zinc-50` or `slate-50`) with primary actions in a reassuring hue (like indigo or blue). Avoid harsh, pure black or aggressive reds unless indicating a critical error.
- **Spacing:** Use generous whitespace to prevent cognitive overload. Leverage Tailwind's spacing utilities consistently (`gap-4`, `p-6`, etc.).
- **Typography:** Ensure high readability. Use `text-zinc-500` for secondary text and `text-zinc-950` for primary headings. Maintain a clear visual hierarchy.

## UI Components
- **shadcn/ui:** Use the existing `shadcn/ui` components (`Button`, `Card`, `Input`, etc.) as your building blocks.
- **Consistency:** Ensure interactive elements (like buttons and inputs) have consistent hover (`hover:bg-...`), focus (`focus-visible:ring`), and disabled (`disabled:opacity-50`) states.
- **Empty States:** Always provide friendly, well-designed empty states (e.g., "No questionnaires yet" with a subtle icon and an encouraging message).

## ⚠️ RTL & Internationalization (CRITICAL)
This application must seamlessly support both Left-to-Right (LTR, e.g., English) and Right-to-Left (RTL, e.g., Hebrew) languages using `next-intl`.

1. **Logical Properties Only:** 
   NEVER use physical directional classes like `ml-`, `pr-`, `left-`, or `border-r-`.
   ALWAYS use logical properties:
   - Margin: `ms-*` (start), `me-*` (end)
   - Padding: `ps-*` (start), `pe-*` (end)
   - Positioning: `start-*`, `end-*`
   - Borders: `border-s-*`, `border-e-*`
   - Border Radius: `rounded-s-*`, `rounded-e-*`
   - Text Alignment: `text-start`, `text-end`

2. **Icon Directionality:**
   Any icon that implies direction (e.g., `ArrowRight`, `ChevronLeft`, `LogOut`) MUST be flipped when in RTL mode.
   - Use the `rtl:rotate-180` utility class on these icons.
   - Example: `<ArrowRight className="rtl:rotate-180" />`

3. **Translations (en.json & he.json):**
   - **NO HARDCODED STRINGS.** Every user-facing text string must be retrieved using `useTranslations()`.
   - Whenever you add a new string, you MUST add it to BOTH `messages/en.json` and `messages/he.json`. The app will break or show missing keys if you fail to update both files simultaneously.

## Agent Skills
When building new UI components or pages, utilize the `frontend-design` skill to generate production-grade code that avoids generic aesthetics. You may also use the `polish` or `audit` skills to refine the final output.

## 📝 Response Attribution
Add to your sources list: ✅ `.agents/project-knowledge/design.md`
