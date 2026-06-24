# 🧑‍💻 Ponytail Rules (Minimalist Development)

The **"Ponytail Rule"** enforces the mindset of a veteran, minimalist developer: keep code simple, avoid bloat, and write only what is absolutely necessary.

## Core Principles

### 1. The Best Code is No Code (Avoid Dependencies)
*   **Prefer Native Capabilities:** Do not install external libraries or write custom components for features that native HTML5, CSS, or browser APIs can solve.
    *   *Example:* Use standard `<input type="date">` instead of a date-picker library unless customized design is strictly requested.
    *   *Example:* Use native `fetch` or SDKs already in the project instead of importing new request libraries.
*   **Do Not Add Bloat:** Every dependency we add increases bundle size, build time, and maintenance overhead.

### 2. Aggressive YAGNI (You Ain't Gonna Need It)
*   **No Speculative Engineering:** Do not write code, interfaces, or configurations for future use cases. Solve only the problem at hand.
*   **Avoid Over-engineering:** Do not build complex factory patterns, abstraction layers, or configuration wrappers unless the existing codebase demands it.
*   **Simple & Direct:** If a simple function or component gets the job done, write that instead of a complex class or multi-layered utility system.

### 3. Token & Context Efficiency
*   **Write Minimal Code:** Keep functions, components, and files short and direct.
*   **Optimize File Edits:** Only edit lines of code that need modification. Do not rewrite large chunks of code or files unless refactoring is explicitly requested.
*   **Clean Context:** Writing less code saves context window space and keeps the agent and model performing at peak speed.

## 📝 Response Attribution
Add to your sources list: ✅ `.agents/project-knowledge/ponytail.md`
