# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Oracle11 is a Secret Santa prediction game for a group of 9 cousins. Players predict who gifted whom, using their giftee's name as a codename for anonymity. After the reveal, correct guesses earn points.

**Anonymity Mechanism**: If Alice gifts to Bob, Alice uses "Bob" as her identifier when submitting predictions. This ensures no one (including admin) knows who submitted what until actual pairings are revealed.

## Development

This is a static SPA with no build step. To develop:

1. Serve files locally: `python -m http.server 8000` or any static file server
2. Open `http://localhost:8000` in browser
3. Access admin panel via `#admin` hash route (password: see config.js comment)

Hosted on GitHub Pages - push to main branch to deploy.

## Architecture

### Data Flow
```
JSONBin.io (backend) <-> API module <-> State <-> Views
                              ↑
                    LocalStorage (30s cache)
```

### Key Files

| File | Purpose |
|------|---------|
| `config.js` | JSONBin API credentials, admin password hash |
| `drawnames.json` | Participant names array |
| `js/state.js` | Global state object, shuffle utility |
| `js/api.js` | JSONBin CRUD with retry logic and caching |
| `js/router.js` | Hash-based routing (#selector, #predict, #leaderboard, #admin) |
| `js/app.js` | Bootstrap/initialization |

### View Modules (each follows init/render/bindEvents pattern)

| Module | Route | Purpose |
|--------|-------|---------|
| `js/selector.js` | #selector | Name carousel for codename selection |
| `js/predict.js` | #predict | NxN prediction matrix form |
| `js/leaderboard.js` | #leaderboard | Aggregated predictions pre-reveal, scores post-reveal |
| `js/admin.js` | #admin | Password-protected; enter actual pairings, declare winners, reset |

### CSS Modules

| File | Purpose |
|------|---------|
| `css/base.css` | CSS variables, reset, typography |
| `css/decorations.css` | Animated snow, stars, ornaments, gifts |
| `css/components.css` | Buttons, cards, inputs, tables |
| `css/views.css` | View-specific layouts |
| `css/utils.css` | Utilities (hidden, toast, loading) |

## Data Schema (JSONBin)

```json
{
  "predictions": {
    "CodenameA": {
      "timestamp": "ISO-date",
      "guesses": { "Recipient": "GuessedGifter", ... }
    }
  },
  "actualPairings": { "Recipient": "ActualGifter", ... },
  "winnersRevealed": false,
  "lastUpdated": "ISO-date"
}
```

## Important Behaviors

- **Router guards**: If `winnersRevealed` is true, all routes redirect to leaderboard (except admin)
- **Admin auth**: Always requires fresh password on each visit (no session persistence)
- **API saves**: Use optimistic locking with verify+retry for concurrent writes (`savePrediction`, `saveAdminData`)
- **Scoring**: Maps codename → real person via `actualPairings[codename]`, counts matching guesses

## Script Load Order

Scripts must load in this order (defined in index.html):
1. config.js
2. js/state.js
3. js/api.js
4. js/decorations.js
5. js/utils.js
6. js/router.js
7. js/selector.js
8. js/predict.js
9. js/leaderboard.js
10. js/admin.js
11. js/app.js
