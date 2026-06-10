import { useState, type ReactNode } from "react";
import events from "./data/events.json";
import operatingStrategies from "./data/operatingStrategies.json";
import { ASSET_COLORS, advanceSeason, applyCapitalProject, applyEvent, createNewGame, currentSeason, data, finalRating, recalculate, resolveAllRolls, resolveOutagesAndDerates } from "./lib/game";
import type { Difficulty, GameSettings, GameState, Step } from "./types";

const SAVE_KEY = "electron-to-market-save";
const stepOrder: Step[] = ["rolls", "budget", "fuel", "ops", "capital", "event", "outages", "results"];

export default function App() {
  const savedGame = loadGame();
  const [game, setGame] = useState<GameState>(() => savedGame || createNewGame());
  const [step, setStep] = useState<Step>(() => (savedGame ? "rolls" : "home"));
  const season = currentSeason(game);

  function save(next = game) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(next));
  }

  function update(next: GameState) {
    setGame(next);
    save(next);
  }

  function nextStep() {
    const i = stepOrder.indexOf(step);
    if (step === "results" && game.currentSeasonIndex === game.seasons.length - 1) return setStep("yearEnd");
    if (step === "results") {
      update(advanceSeason(game));
      return setStep("rolls");
    }
    setStep(stepOrder[Math.min(stepOrder.length - 1, i + 1)]);
  }

  return (
    <AppLayout
      game={game}
      step={step}
      onNavigate={setStep}
      onSave={() => save()}
      onReset={() => {
        localStorage.removeItem(SAVE_KEY);
        setGame(createNewGame());
        setStep("home");
      }}
    >
      {step === "home" && <HomeScreen onStart={() => setStep("setup")} onLoad={() => {
        const loaded = loadGame();
        if (loaded) {
          setGame(loaded);
          setStep("rolls");
        }
      }} onHow={() => setStep("how")} />}
      {step === "how" && <HowToPlay onBack={() => setStep("home")} />}
      {step === "setup" && <SetupScreen onStart={(next) => { update(next); setStep("rolls"); }} />}
      {step !== "home" && step !== "setup" && step !== "how" && step !== "yearEnd" && (
        <>
          <SeasonStepper step={step} onStep={setStep} />
          <Dashboard game={game} />
        </>
      )}
      {step === "rolls" && <MarketRollScreen game={game} onResolve={(rolls) => update(resolveAllRolls(game, rolls))} onNext={nextStep} />}
      {step === "budget" && <BudgetScreen game={game} onUpdate={update} onNext={nextStep} />}
      {step === "fuel" && <FuelScreen game={game} onUpdate={update} onNext={nextStep} />}
      {step === "ops" && <OperatingScreen game={game} onUpdate={update} onNext={nextStep} />}
      {step === "capital" && <CapitalScreen game={game} onUpdate={update} onNext={nextStep} />}
      {step === "event" && <EventScreen game={game} onUpdate={update} onNext={nextStep} />}
      {step === "outages" && <OutageScreen game={game} onUpdate={update} onNext={nextStep} />}
      {step === "results" && <ResultsScreen game={game} onNext={nextStep} />}
      {step === "yearEnd" && <YearEnd game={game} onHome={() => setStep("home")} />}
      {step !== "home" && step !== "setup" && step !== "how" && <FacilitatorNotesPanel season={season} />}
    </AppLayout>
  );
}

function AppLayout({ game, step, children, onNavigate, onSave, onReset }: { game: GameState; step: Step; children: ReactNode; onNavigate: (step: Step) => void; onSave: () => void; onReset: () => void }) {
  return (
    <div className="app-shell">
      <Header game={game} />
      <main>{children}</main>
      <SaveLoadControls step={step} onNavigate={onNavigate} onSave={onSave} onReset={onReset} />
    </div>
  );
}

function Header({ game }: { game: GameState }) {
  return (
    <header className="topbar">
      <div>
        <div className="eyebrow">Facilitator-Led Utility Operations Simulation</div>
        <h1>Electron to Market</h1>
      </div>
      <div className="header-meta">
        <span>{game.gameName}</span>
        <span>{game.difficulty}</span>
        <span>{game.facilitatorName || "Facilitator"}</span>
      </div>
    </header>
  );
}

function HomeScreen({ onStart, onLoad, onHow }: { onStart: () => void; onLoad: () => void; onHow: () => void }) {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">Corporate workshop simulation</p>
        <h2>Run a regulated utility through one year of uncertainty.</h2>
        <p>Allocate real-dollar budgets, hedge fuel, set operating posture, handle outages, and see how profit, reliability, and customers move together.</p>
        <div className="button-row">
          <button onClick={onStart}>Start New Game</button>
          <button className="secondary" onClick={onLoad}>Load Saved Game</button>
          <button className="ghost" onClick={onHow}>How to Play</button>
        </div>
      </div>
      <div className="fleet-board">
        {data.assetsData.map((asset) => (
          <div className="fleet-line" key={asset.id}>
            <span style={{ background: ASSET_COLORS[asset.id] }} />
            <strong>{asset.name}</strong>
            <em>{asset.capacityMw ? `${asset.capacityMw.toLocaleString()} MW` : "Delivery system"}</em>
          </div>
        ))}
      </div>
    </section>
  );
}

function SetupScreen({ onStart }: { onStart: (game: GameState) => void }) {
  const [gameName, setGameName] = useState("Workshop Utility");
  const [facilitatorName, setFacilitatorName] = useState("");
  const [seed, setSeed] = useState(String(Date.now()));
  const [difficulty, setDifficulty] = useState<Difficulty>("Standard");
  const [settings, setSettings] = useState<GameSettings>(createNewGame().settings);
  const toggle = (key: keyof GameSettings) => setSettings((current) => ({ ...current, [key]: !current[key] }));
  return (
    <section className="panel setup">
      <h2>Game Setup</h2>
      <div className="form-grid">
        <label>Game name<input value={gameName} onChange={(e) => setGameName(e.target.value)} /></label>
        <label>Facilitator<input value={facilitatorName} onChange={(e) => setFacilitatorName(e.target.value)} /></label>
        <label>Random seed<input value={seed} onChange={(e) => setSeed(e.target.value)} /></label>
        <label>Difficulty<select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}><option>Intro</option><option>Standard</option><option>Chaos</option></select></label>
      </div>
      <div className="toggle-grid">
        {Object.keys(settings).map((key) => <label className="toggle" key={key}><input type="checkbox" checked={settings[key as keyof GameSettings]} onChange={() => toggle(key as keyof GameSettings)} />{labelize(key)}</label>)}
      </div>
      <button onClick={() => onStart(createNewGame({ gameName, facilitatorName, seed, difficulty, settings }))}>Start Game</button>
    </section>
  );
}

function Dashboard({ game }: { game: GameState }) {
  const season = currentSeason(game);
  return (
    <section className="dashboard">
      <DashboardMetricCard label="Season" value={season.name} />
      <DashboardMetricCard label="Budget" value={`$${season.budget}M`} />
      <DashboardMetricCard label="Spend" value={`$${season.spend}M`} tone={season.spend > season.budget ? "bad" : "neutral"} />
      <DashboardMetricCard label="Unspent" value={`$${season.unspentBudget}M`} />
      <DashboardMetricCard label="Market" value={season.marketPrice ? `$${season.marketPrice}/MWh` : "-"} />
      <DashboardMetricCard label="Demand" value={season.demandMw ? `${season.demandMw.toLocaleString()} MW` : "-"} />
      <DashboardMetricCard label="Available" value={season.availableMw ? `${season.availableMw.toLocaleString()} MW` : "-"} />
      <DashboardMetricCard label="Profit" value={`$${game.totalProfit}M`} tone={game.totalProfit < 0 ? "bad" : "good"} />
      <DashboardMetricCard label="Reliability" value={`${season.reliabilityScore}/5`} />
      <DashboardMetricCard label="Customers" value={`${season.customerImpactScore}/5`} />
      <DashboardMetricCard label="Trend" value={`${game.marketTrend > 0 ? "+" : ""}${game.marketTrend}`} />
      <DashboardMetricCard label="Capital" value={`$${game.totalCapitalInvested}M`} />
    </section>
  );
}

function DashboardMetricCard({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "good" | "bad" }) {
  return <div className={`metric ${tone}`}><span>{label}</span><strong>{value}</strong></div>;
}

function SeasonStepper({ step, onStep }: { step: Step; onStep: (step: Step) => void }) {
  return (
    <nav className="stepper">
      {stepOrder.map((item) => <button className={step === item ? "active" : ""} key={item} onClick={() => onStep(item)}>{labelize(item)}</button>)}
    </nav>
  );
}

function MarketRollScreen({ game, onResolve, onNext }: { game: GameState; onResolve: (rolls?: Partial<Record<"market" | "demand" | "coal" | "gas" | "hydro", number>>) => void; onNext: () => void }) {
  const season = currentSeason(game);
  const [rolls, setRolls] = useState({ market: 3, demand: 3, coal: 3, gas: 3, hydro: 4 });
  return (
    <section className="panel">
      <h2>Market, Demand, Fuel, and Hydro Rolls</h2>
      <div className="roll-grid">
        {(["market", "demand", "coal", "gas", "hydro"] as const).map((key) => (
          <DiceRoller key={key} label={labelize(key)} value={rolls[key]} onRoll={() => setRolls({ ...rolls, [key]: Math.floor(Math.random() * 6) + 1 })} onChange={(value) => setRolls({ ...rolls, [key]: value })} />
        ))}
      </div>
      <RollTable />
      <div className="button-row"><button onClick={() => onResolve(rolls)}>Apply Manual Rolls</button><button className="secondary" onClick={() => onResolve()}>Auto Roll from Seed</button><button onClick={onNext} disabled={!season.marketPrice}>Continue</button></div>
    </section>
  );
}

function BudgetScreen({ game, onUpdate, onNext }: { game: GameState; onUpdate: (game: GameState) => void; onNext: () => void }) {
  const season = currentSeason(game);
  const overspent = season.spend > season.budget && !game.settings.allowDeficitSpending;
  function select(assetId: string, optionId: string) {
    const next = structuredClone(game);
    currentSeason(next).selectedBudgetOptions[assetId] = optionId;
    onUpdate(recalculate(next));
  }
  return (
    <section className="panel">
      <h2>Budget Allocation</h2>
      <div className="asset-grid">
        {Object.values(game.assets).map((asset) => <AssetCard key={asset.id} asset={asset} selected={season.selectedBudgetOptions[asset.id]} onSelect={(id) => select(asset.id, id)} />)}
      </div>
      <BudgetFooter seasonSpend={season.spend} budget={season.budget} />
      <button disabled={overspent} onClick={onNext}>{overspent ? "Spending exceeds budget" : "Continue"}</button>
    </section>
  );
}

function AssetCard({ asset, selected, onSelect }: { asset: GameState["assets"][string]; selected: string; onSelect: (id: string) => void }) {
  return (
    <article className="asset-card" style={{ borderTopColor: ASSET_COLORS[asset.id] }}>
      <div className="asset-head"><h3>{asset.name}</h3><span>{asset.capacityMw ? `${asset.capacityMw.toLocaleString()} MW` : asset.role}</span></div>
      <p>Condition {asset.condition}/10 | EFOR {asset.eforRisk} | Derate {asset.derateRisk}</p>
      <div className="option-list">
        {(data.budgetOptions as Record<string, Array<{ id: string; name: string; cost: number; effect: string }>>)[asset.id].map((option) => <BudgetOptionCard key={option.id} option={option} selected={selected === option.id} onClick={() => onSelect(option.id)} />)}
      </div>
    </article>
  );
}

function BudgetOptionCard({ option, selected, onClick }: { option: { name: string; cost: number; effect: string }; selected: boolean; onClick: () => void }) {
  return <button className={`choice ${selected ? "selected" : ""}`} onClick={onClick}><strong>{option.name}</strong><span>${option.cost}M</span><em>{option.effect}</em></button>;
}

function FuelScreen({ game, onUpdate, onNext }: { game: GameState; onUpdate: (game: GameState) => void; onNext: () => void }) {
  const season = currentSeason(game);
  function select(fuel: "coal" | "gas", id: string) {
    const next = structuredClone(game);
    currentSeason(next).selectedFuelStrategies[fuel] = id;
    onUpdate(recalculate(next));
  }
  return (
    <section className="panel">
      <h2>Fuel Contracting and Hedging</h2>
      <div className="two-col">
        {(["coal", "gas"] as const).map((fuel) => (
          <div className="strategy-panel" key={fuel}>
            <h3>{labelize(fuel)} Strategy</h3>
            <p>Rolled cost: ${fuel === "coal" ? season.coalFuelCost : season.gasFuelCost}/MWh</p>
            {data.fuelStrategies[fuel].map((option) => <FuelStrategyCard key={option.id} option={option} selected={season.selectedFuelStrategies[fuel] === option.id} onClick={() => select(fuel, option.id)} />)}
          </div>
        ))}
      </div>
      <BudgetFooter seasonSpend={season.spend} budget={season.budget} />
      <button onClick={onNext}>Continue</button>
    </section>
  );
}

function FuelStrategyCard({ option, selected, onClick }: { option: { name: string; cost: number; effect: string }; selected: boolean; onClick: () => void }) {
  return <button className={`choice ${selected ? "selected" : ""}`} onClick={onClick}><strong>{option.name}</strong><span>${option.cost}M</span><em>{option.effect}</em></button>;
}

function OperatingScreen({ game, onUpdate, onNext }: { game: GameState; onUpdate: (game: GameState) => void; onNext: () => void }) {
  const season = currentSeason(game);
  function select(assetId: string, strategy: string) {
    const next = structuredClone(game);
    currentSeason(next).selectedOperatingStrategies[assetId] = strategy;
    onUpdate(recalculate(next));
  }
  return (
    <section className="panel">
      <h2>Operating Strategy</h2>
      <div className="asset-grid compact">
        {Object.values(game.assets).map((asset) => <OperatingStrategySelector key={asset.id} assetName={asset.name} color={ASSET_COLORS[asset.id]} selected={season.selectedOperatingStrategies[asset.id]} onSelect={(id) => select(asset.id, id)} />)}
      </div>
      <CapacityStackBar game={game} />
      <button onClick={onNext}>Continue</button>
    </section>
  );
}

function OperatingStrategySelector({ assetName, color, selected, onSelect }: { assetName: string; color: string; selected: string; onSelect: (id: string) => void }) {
  return (
    <div className="strategy-selector" style={{ borderLeftColor: color }}>
      <h3>{assetName}</h3>
      <div className="segmented">
        {operatingStrategies.map((item) => <button key={item.id} className={selected === item.id ? "active" : ""} onClick={() => onSelect(item.id)}>{item.name}</button>)}
      </div>
    </div>
  );
}

function CapitalScreen({ game, onUpdate, onNext }: { game: GameState; onUpdate: (game: GameState) => void; onNext: () => void }) {
  const season = currentSeason(game);
  return (
    <section className="panel">
      <h2>Capital Investment</h2>
      <p className="muted">Management may approve one capital project per season. For every $100M approved, future annual profit adds +$8M.</p>
      <div className="project-grid">
        {data.capitalProjects.map((project) => <button className={`choice ${season.selectedCapitalProject === project.id ? "selected" : ""}`} key={project.id} onClick={() => onUpdate(applyCapitalProject(game, project.id))}><strong>{project.name}</strong><span>${project.cost}M</span><em>{project.effect}</em></button>)}
      </div>
      <BudgetFooter seasonSpend={season.spend} budget={season.budget} />
      <button onClick={onNext}>Continue</button>
    </section>
  );
}

function EventScreen({ game, onUpdate, onNext }: { game: GameState; onUpdate: (game: GameState) => void; onNext: () => void }) {
  const season = currentSeason(game);
  const [selected, setSelected] = useState(events[0].id);
  const eventApplied = Boolean(season.eventDrawn);
  return (
    <section className="panel">
      <h2>Event Card</h2>
      <div className="event-grid">
        {events.map((event) => <EventCard key={event.id} event={event} selected={selected === event.id || season.eventDrawn === event.id} onClick={() => !eventApplied && setSelected(event.id)} />)}
      </div>
      {eventApplied && <p className="status-note">Applied: {events.find((event) => event.id === season.eventDrawn)?.name}</p>}
      <div className="button-row"><button disabled={eventApplied} onClick={() => onUpdate(applyEvent(game, selected))}>Apply Selected Event</button><button disabled={eventApplied} className="secondary" onClick={() => onUpdate(applyEvent(game, events[Math.floor(Math.random() * events.length)].id))}>Draw Random</button><button onClick={onNext} disabled={!season.eventDrawn}>Continue</button></div>
    </section>
  );
}

function EventCard({ event, selected, onClick }: { event: { name: string; effect: string }; selected: boolean; onClick: () => void }) {
  return <button className={`event-card ${selected ? "selected" : ""}`} onClick={onClick}><strong>{event.name}</strong><span>{event.effect}</span></button>;
}

function OutageScreen({ game, onUpdate, onNext }: { game: GameState; onUpdate: (game: GameState) => void; onNext: () => void }) {
  const season = currentSeason(game);
  const hasResults = Object.keys(season.outageResults).length > 0;
  return (
    <section className="panel">
      <h2>Outage and Derate Resolution</h2>
      <button onClick={() => onUpdate(resolveOutagesAndDerates(game))}>Auto-Resolve All</button>
      {hasResults && <div className="results-grid">{Object.entries(season.outageResults).map(([assetId, result]) => <ResultLine key={assetId} name={game.assets[assetId].name} result={result} />)}</div>}
      {hasResults && <h3>Derates</h3>}
      {hasResults && <div className="results-grid">{Object.entries(season.derateResults).map(([assetId, result]) => <ResultLine key={assetId} name={game.assets[assetId].name} result={result} />)}</div>}
      <button onClick={onNext} disabled={!hasResults}>Continue</button>
    </section>
  );
}

function ResultLine({ name, result }: { name: string; result: { roll: number; label: string; capacityImpactMw: number; profitImpact: number; notes: string[] } }) {
  return <div className="result-line"><strong>{name}</strong><span>Roll {result.roll}: {result.label}</span><em>-{result.capacityImpactMw} MW | -${result.profitImpact}M</em><p>{result.notes.join(" ")}</p></div>;
}

function ResultsScreen({ game, onNext }: { game: GameState; onNext: () => void }) {
  const season = currentSeason(game);
  return (
    <section className="panel">
      <h2>{season.name} Results</h2>
      <div className="two-col">
        <ProfitBridge season={season} />
        <ResultsSummary game={game} />
      </div>
      <button onClick={onNext}>{game.currentSeasonIndex === game.seasons.length - 1 ? "Year-End Summary" : "Advance Season"}</button>
    </section>
  );
}

function ProfitBridge({ season }: { season: ReturnType<typeof currentSeason> }) {
  const rows = [
    ["Starting budget", season.budget],
    ["Total spend", -season.spend],
    ["Unspent budget", season.unspentBudget],
    ["Market margin", season.marketMargin],
    ["Renewable payment", season.subsidyPayments],
    ["Emergency purchases", -season.emergencyPurchases],
    ["Penalties", -season.penalties],
    ["Net profit", season.profit],
  ];
  return <div className="bridge"><h3>Profit Bridge</h3>{rows.map(([label, value]) => <div key={label as string}><span>{label}</span><strong>{Number(value) < 0 ? "-" : ""}${Math.abs(Number(value))}M</strong></div>)}</div>;
}

function ResultsSummary({ game }: { game: GameState }) {
  const season = currentSeason(game);
  return (
    <div className="summary">
      <h3>Debrief</h3>
      <p><strong>Reliability:</strong> {season.reliabilityScore}/5</p>
      <p><strong>Customer impact:</strong> {season.customerImpactScore}/5</p>
      <p><strong>Lesson:</strong> Unspent budget became profit only where reliability, fuel exposure, and storm/event preparation held up.</p>
      <ul>{season.notes.slice(-8).map((note) => <li key={note}>{note}</li>)}</ul>
    </div>
  );
}

function YearEnd({ game, onHome }: { game: GameState; onHome: () => void }) {
  const best = [...game.seasons].sort((a, b) => b.profit - a.profit)[0];
  const worst = [...game.seasons].sort((a, b) => a.profit - b.profit)[0];
  return (
    <section className="panel year-end">
      <h2>Year-End Summary</h2>
      <Scoreboard game={game} />
      <div className="two-col">
        <div className="summary"><h3>Operating Review</h3><p>Best season: {best.name} (${best.profit}M)</p><p>Worst season: {worst.name} (${worst.profit}M)</p><p>Biggest risk taken: {findRisk(game)}</p><p>Highest value investment: {game.activeInvestments[0] ? labelize(game.activeInvestments[0]) : "None"}</p></div>
        <div className="summary"><h3>Final Rating</h3><div className="rating">{finalRating(game)}</div><p>Profit discipline works when it does not create hidden reliability debt.</p></div>
      </div>
      <button onClick={onHome}>Return Home</button>
    </section>
  );
}

function Scoreboard({ game }: { game: GameState }) {
  const avgRel = average(game.seasons.map((s) => s.reliabilityScore));
  const avgCust = average(game.seasons.map((s) => s.customerImpactScore));
  return <div className="scoreboard"><DashboardMetricCard label="Annual Profit" value={`$${game.totalProfit}M`} /><DashboardMetricCard label="Avg Reliability" value={`${avgRel.toFixed(1)}/5`} /><DashboardMetricCard label="Avg Customers" value={`${avgCust.toFixed(1)}/5`} /><DashboardMetricCard label="Regulatory Trust" value={`${game.regulatoryTrust}/5`} /></div>;
}

function CapacityStackBar({ game }: { game: GameState }) {
  const season = currentSeason(game);
  const total = Math.max(season.availableMw || 1, season.demandMw || 1);
  return (
    <div className="capacity-wrap">
      <div className="capacity-label"><span>Available Capacity</span><strong>{(season.availableMw || 0).toLocaleString()} MW vs {(season.demandMw || 0).toLocaleString()} MW demand</strong></div>
      <div className="capacity-bar">
        {Object.values(game.assets).filter((asset) => asset.id !== "td").map((asset) => <span key={asset.id} style={{ width: `${(Math.max(0, asset.availableMw) / total) * 100}%`, background: ASSET_COLORS[asset.id] }} title={asset.name} />)}
        <i style={{ left: `${Math.min(100, ((season.demandMw || 0) / total) * 100)}%` }} />
      </div>
    </div>
  );
}

function FacilitatorNotesPanel({ season }: { season: ReturnType<typeof currentSeason> }) {
  return <aside className="notes"><h3>Facilitator Notes</h3><p>Ask teams which saved dollar produced profit and which saved dollar created risk.</p><ul>{season.notes.slice(-4).map((note) => <li key={note}>{note}</li>)}</ul></aside>;
}

function SaveLoadControls({ step, onNavigate, onSave, onReset }: { step: Step; onNavigate: (step: Step) => void; onSave: () => void; onReset: () => void }) {
  if (step === "home") return null;
  return <div className="save-controls"><button className="secondary" onClick={onSave}>Save</button><button className="ghost" onClick={() => onNavigate("home")}>Home</button><button className="danger" onClick={onReset}>Reset</button></div>;
}

function DiceRoller({ label, value, onRoll, onChange }: { label: string; value: number; onRoll: () => void; onChange: (value: number) => void }) {
  return <div className="dice"><span>{label}</span><strong>{value}</strong><input type="range" min="1" max="6" value={value} onChange={(e) => onChange(Number(e.target.value))} /><button className="secondary" onClick={onRoll}>Roll d6</button></div>;
}

function RollTable() {
  return <div className="roll-table"><h3>Market Price Table</h3>{data.marketTables.market.map((row) => <div key={row.roll}><span>{row.roll}</span><strong>{row.label}</strong><em>${row.price}/MWh</em></div>)}</div>;
}

function BudgetFooter({ seasonSpend, budget }: { seasonSpend: number; budget: number }) {
  return <div className="budget-footer"><span>Budget ${budget}M</span><strong>Allocated ${seasonSpend}M</strong><em>Remaining ${budget - seasonSpend}M</em></div>;
}

function HowToPlay({ onBack }: { onBack: () => void }) {
  return <section className="panel"><h2>How to Play</h2><p>Each season, roll conditions, fund assets, choose fuel and operating strategies, approve optional capital, draw an event, resolve outages, and review profit and reliability results.</p><p>Every dollar not spent can become profit, but underspending raises the chance of derates, forced outages, emergency purchases, customer pain, and regulatory trust loss.</p><button onClick={onBack}>Back</button></section>;
}

function loadGame(): GameState | null {
  const raw = localStorage.getItem(SAVE_KEY);
  return raw ? normalizeLoadedGame(JSON.parse(raw) as GameState) : null;
}

function normalizeLoadedGame(game: GameState): GameState {
  for (const season of game.seasons) {
    season.eventCapacityAdjustments ||= {};
    season.outageCapacityAdjustments ||= {};
    season.eventMarketMargin ||= 0;
    season.eventPenalties ||= 0;
    season.outagePenalties ||= 0;
    season.eventReliabilityDelta ||= 0;
    season.outageReliabilityDelta ||= 0;
    season.eventCustomerDelta ||= 0;
    season.outageCustomerDelta ||= 0;
    season.capitalCustomerDelta ||= 0;
  }
  return game;
}

function labelize(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function findRisk(game: GameState) {
  const deferred = game.seasons.flatMap((season) => Object.entries(season.selectedBudgetOptions).filter(([, value]) => value === "defer").map(([asset]) => asset));
  return deferred[0] ? `${labelize(deferred[0])} deferred work` : "No major deferral";
}
