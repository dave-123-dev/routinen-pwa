This folder contains superseded implementation files that are no longer part of the active app runtime.

Why they are kept:
- historical reference during the refactor
- easier comparison when validating behavior changes
- safer rollback path while the modular structure settles

Active code now lives in:
- `src/app.js`
- `src/domain/`
- `src/storage/`
- `src/ui/`
- `src/views/`
- `styles/`
