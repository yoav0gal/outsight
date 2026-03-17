# 🧪 Testing, Linting & QA Guidelines

## Build & Run Commands
Use the following commands to interact with the project:
- **Development Server:** `npm run dev` (starts on localhost:3000)
- **Production Build:** `npm run build`
- **Start Production Server:** `npm run start`

## Linting & Formatting
- **Linting:** `npm run lint` (runs ESLint based on `eslint.config.mjs`)
- **Type Checking:** Run `npx tsc --noEmit` to verify TypeScript types across the project.
- Always ensure that your code passes linting and type checking before considering a task complete. Fix any warnings or errors you introduce.

## Testing (Current State & Future)
- **Current State:** As of the current project snapshot, there is no standardized test suite configured (e.g., Jest, Vitest, Playwright).
- **If tests are added in the future:** Use standard commands like `npm test` or `npx vitest`.
- **Running a single test:** If a test framework is introduced (e.g., Vitest), run a single test using `npx vitest run path/to/test.spec.ts`.
- **Manual Verification:** Since automated tests are not yet set up, heavily rely on type checking (`tsc`) and local development server validation to ensure your changes work as intended.

## 📝 Response Attribution
Add to your sources list: ✅ `.agents/project-knowledge/testing.md`
