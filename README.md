# Electron to Market

Browser-based facilitator utility operations simulation for a 60-90 minute corporate workshop.

## Working App

The runnable game is dependency-free:

- `index.html`
- `app.css`
- `app.js`

Open `index.html` directly in a browser, or serve the folder with any static server.

## Cloudflare Pages

Use these settings:

- Build command: leave blank
- Build output directory: `/`
- Root directory: repository root

The playable site is static and loads from `index.html`, `app.css`, `app.js`, and `assets/cutscenes/`.

## Current Game Loop

The year now plays as two prep/peak pairs:

- Spring: prepare the fleet, fuel book, grid, and capital plan for Summer.
- Summer: higher demand and larger market upside; Spring readiness creates revenue or missed-prep penalties.
- Fall: prepare for Winter.
- Winter: higher demand and larger market upside; Fall readiness carries into winter operations.

The game also includes image-backed cutscenes under `assets/cutscenes/` for peak wins, reliability crises, storm/customer pain, missed market opportunities, prep success, and prep failure.

Oregon Trail-style journey elements keep the room engaged:

- A year trail across the top of the play screen with a utility truck that advances through all 32 stages from Spring to Year End.
- A named crew of six asset leads whose status reacts to outages and who quote in the decision feed when their unit trips.
- One seeded "Field Dispatch" dilemma per season (squirrel at the substation, vibration alarm, spare transformer auction, the intern's forecast...) with a safe paid option and a free risky option resolved by a hidden seeded roll.
- Deadpan dispatch one-liners per stage, and a year-end crew debrief with an epitaph for the year ("You have died of load shedding").

Market price is now formed from one combined demand/market roll: higher demand maps directly to a higher base market price. Coal cost, gas cost, and market trend can move that final price further. Hydro has no fuel cost; coal/gas dispatch creates the large seasonal fuel-cost expense, so fuel price and demand dominate financial outcomes more than ordinary maintenance spending.

## Facilitating with Teams

The in-game "How to Play" screen includes the full guide. Short version:

- 12–30 participants: six asset teams — Nuclear, Coal, Natural Gas, Renewables, Hydro, and T&D/Grid — each owning their card every season.
- 6–11 participants: pair Coal+Gas and Renewables+Hydro into two combined teams.
- Larger rooms: add a Fuel Desk team for the contracting stage and a CFO team that owns the capital decision.
- Each stage, give teams 2–3 minutes to argue for their spend; the facilitator enters the room's decisions and reads the consequences aloud.

## Original React Stack

- React
- TypeScript
- Vite
- Static JSON game configuration
- LocalStorage save/load

## Run

The React/Vite scaffold is still present for a future migration. To run that version, install dependencies, then start Vite:

```powershell
npm install
npm run dev
```

Build for static hosting:

```powershell
npm run build
```

The built app can be deployed to Cloudflare Pages, GitHub Pages, Netlify, or static internal hosting.

## Editable Game Data

Tunable game values live in `src/data`:

- `assets.json`
- `seasons.json`
- `marketTables.json`
- `budgetOptions.json`
- `fuelStrategies.json`
- `operatingStrategies.json`
- `events.json`
- `capitalProjects.json`
- `scoringRules.json`

Core simulation functions are in `src/lib/game.ts`.
