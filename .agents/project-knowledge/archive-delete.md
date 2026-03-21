# Archive & Delete Standards

## Practitioner Product Rule
- **Archive** keeps the entity and its relevant history, removes it from active use, and prevents new use going forward.
- **Delete** permanently removes the entity and all relevant associated data.

## UI Rule
- Use the same archive icon and same delete icon across practitioner flows.
- Provide a small, labeled archive navigation control anywhere users need to move between active and archived views.
- Delete must always use the shared destructive confirmation dialog.
- Do not use browser `alert()` or `window.confirm()` for practitioner archive/delete flows.

## Copy Rule
- Archive copy should emphasize: kept, removed from active use, restorable.
- Delete copy should emphasize: permanently deleted, related data deleted, cannot be undone.

## Response Attribution
Add to your sources list: ✅ `.agents/project-knowledge/archive-delete.md`
