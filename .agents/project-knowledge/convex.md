# 🗄️ Backend & Database (Convex) Guidelines

## Queries & Mutations
- Use Convex for backend logic. Define queries for fetching data and mutations for updating data.
- Maintain strict type safety on arguments and return values.

## Convex Helpers
- Utilize `convex-helpers` where applicable for common database patterns.

## Client Usage
- In client components, use Convex React hooks (`useQuery`, `useMutation`).
- In server components, fetch data using the Convex client if necessary (though consider if it's strictly needed or if it can be passed from a parent).

## Error Handling
- **Backend Errors:** Catch errors from Convex mutations and queries gracefully on the client side, displaying appropriate toast notifications or error messages to the user.
- **Logging:** Do not log sensitive information (tokens, passwords) to the console or backend logs.