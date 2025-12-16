# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Oracle11 is a Secret Santa prediction game supporting multiple celebrations. Players predict who gifted whom, and after the reveal, correct guesses earn points.

**Multi-Celebration Support**: The app supports multiple celebrations, each with its own participants, JSONBin storage, and password protection. Users select a celebration, authenticate, select their name, then proceed to make predictions.

## Development

This is a static SPA with no build step. To develop:

1. Serve files locally: `python -m http.server 8000` or any static file server
2. Open `http://localhost:8000` in browser
3. Access admin panel via `#admin` hash route (password: see config.js comment)

Hosted on GitHub Pages - push to main branch to deploy.

## Architecture

### Data Flow
```
drawnames.json (celebrations config)
         ↓
JSONBin.io (per-celebration backend) <-> API module <-> State <-> Views
                                              ↑
                              LocalStorage (30s cache, per-celebration)
```

### Key Files

| File | Purpose |
|------|---------|
| `config.js` | JSONBin API key (shared), admin password hash |
| `drawnames.json` | Celebrations config with participants, binIds, password hashes |
| `js/state.js` | Global state object, celebration helpers, shuffle utility |
| `js/api.js` | JSONBin CRUD with retry logic and celebration-specific caching |
| `js/router.js` | Hash-based routing with celebration guards |
| `js/app.js` | Bootstrap/initialization with session restoration |

### View Modules (each follows init/render/bindEvents pattern)

| Module | Route | Purpose |
|--------|-------|---------|
| `js/celebrations.js` | #celebrations, #celebration-auth | Celebration picker and password auth |
| `js/selector.js` | #selector | Name carousel for player name selection |
| `js/predict.js` | #predict | NxN prediction matrix form |
| `js/leaderboard.js` | #leaderboard | Aggregated predictions pre-reveal, scores post-reveal |
| `js/admin.js` | #admin | Password-protected; enter actual pairings, declare winners, reset |

### CSS Modules

| File | Purpose |
|------|---------|
| `css/base.css` | CSS variables, reset, typography |
| `css/decorations.css` | Animated snow, stars, ornaments, gifts |
| `css/components.css` | Buttons, cards, inputs, tables |
| `css/views.css` | View-specific layouts (including celebrations views) |
| `css/utils.css` | Utilities (hidden, toast, loading) |

## Data Schema

### drawnames.json (Celebrations Config)

```json
{
  "celebrations": {
    "christmas2024": {
      "name": "Christmas 2024",
      "participants": ["Name1", "Name2", ...],
      "binId": "jsonbin-id-here",
      "passwordHash": "sha256-hash-of-password"
    }
  }
}
```

### JSONBin (Per-Celebration Data)

**Data structure uses `{santa: recipient}` format throughout for consistency with UI.**

```json
{
  "predictions": {
    "Alice": {
      "timestamp": "ISO-date",
      "guesses": { "GuessedSanta": "GuessedRecipient", ... }
    }
  },
  "actualPairings": { "ActualSanta": "ActualRecipient", ... },
  "winnersRevealed": false,
  "lastUpdated": "ISO-date"
}
```

Example: If Alice gives to Bob:
- `actualPairings: { "Alice": "Bob" }` (Alice → Bob)
- Alice selects her own name "Alice" when making predictions
- Her predictions stored under `predictions["Alice"].guesses`

## Important Behaviors

- **Celebration auth**: Users must select and authenticate to a celebration before accessing predictions
- **Router guards**:
  - All routes except #celebrations and #admin require celebration authentication
  - If `winnersRevealed` is true, routes redirect to leaderboard (except admin)
- **Admin auth**: Global admin password (in config.js) can manage any celebration
- **Session persistence**: Celebration selection and auth persists in sessionStorage
- **API saves**: Use optimistic locking with verify+retry for concurrent writes
- **Caching**: Cache keys are celebration-specific (`oracle11_cache_{celebrationKey}`)

## User Flow

```
#celebrations (select celebration)
    ↓
#celebration-auth (enter password)
    ↓
#selector (select your name)
    ↓
#predict (make predictions)
    ↓
#leaderboard (view results)
```

## Script Load Order

Scripts must load in this order (defined in index.html):
1. config.js
2. js/state.js
3. js/api.js
4. js/decorations.js
5. js/utils.js
6. js/router.js
7. js/celebrations.js
8. js/selector.js
9. js/predict.js
10. js/leaderboard.js
11. js/admin.js
12. js/app.js

## Adding a New Celebration

1. Create a new JSONBin using the API:
   ```bash
   curl -X POST "https://api.jsonbin.io/v3/b" \
     -H "Content-Type: application/json" \
     -H "X-Access-Key: <API_KEY>" \
     -H "X-Bin-Name: oracle11-newcelebration" \
     -d '{"predictions":{},"actualPairings":null,"winnersRevealed":false}'
   ```
2. Generate SHA-256 hash of the celebration password
3. Add entry to `drawnames.json` celebrations object with participants, binId, and passwordHash
