import assetsData from "../data/assets.json";
import seasonsData from "../data/seasons.json";
import marketTables from "../data/marketTables.json";
import budgetOptions from "../data/budgetOptions.json";
import fuelStrategies from "../data/fuelStrategies.json";
import operatingStrategies from "../data/operatingStrategies.json";
import capitalProjects from "../data/capitalProjects.json";
import scoringRules from "../data/scoringRules.json";
import type { AssetState, Difficulty, GameSettings, GameState, RiskLevel, RollResult, SeasonState } from "../types";

export const ASSET_COLORS: Record<string, string> = {
  nuclear: "#7c3aed",
  coal: "#4b3023",
  gas: "#2563eb",
  renewables: "#16a34a",
  hydro: "#0891b2",
  td: "#f97316",
};

export const data = { assetsData, seasonsData, marketTables, budgetOptions, fuelStrategies, operatingStrategies, capitalProjects };

const riskThreshold: Record<RiskLevel, number> = { Low: 1, "Medium-Low": 1, Medium: 2, High: 3, Extreme: 4 };
const riskOrder: RiskLevel[] = ["Low", "Medium-Low", "Medium", "High", "Extreme"];

export function rollD6(seed?: string): number {
  if (!seed) return Math.floor(Math.random() * 6) + 1;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (Math.abs(hash) % 6) + 1;
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function applyMarketTrend(baseRoll: number, trend: number): number {
  return clamp(baseRoll + trend, 1, 6);
}

export function resolveMarketPrice(roll: number, trend: number) {
  const finalRoll = applyMarketTrend(roll, trend);
  return (marketTables.market as Array<{ roll: number; label: string; price: number }>).find((row) => row.roll === finalRoll)!;
}

export function resolveDemand(roll: number, permanentChangeMw = 0) {
  const result = (marketTables.demand as Array<{ roll: number; label: string; demandMw: number }>).find((row) => row.roll === roll)!;
  return { ...result, demandMw: result.demandMw + permanentChangeMw };
}

export function resolveFuelPrice(fuelType: "coal" | "gas", roll: number) {
  return (marketTables[fuelType] as Array<{ roll: number; cost: number }>).find((row) => row.roll === roll)!;
}

export function createNewGame(input?: Partial<Pick<GameState, "gameName" | "facilitatorName" | "seed" | "difficulty" | "settings">>): GameState {
  const seasons = seasonsData.map((season) => ({
    name: season.name,
    budget: season.budget,
    selectedBudgetOptions: defaultBudgetSelections(),
    selectedFuelStrategies: { coal: "spot", gas: "spot" },
    selectedOperatingStrategies: Object.fromEntries(assetsData.map((asset) => [asset.id, "normal"])),
    outageResults: {},
    derateResults: {},
    eventCapacityAdjustments: {},
    outageCapacityAdjustments: {},
    spend: 0,
    unspentBudget: season.budget,
    marketMargin: 0,
    eventMarketMargin: 0,
    subsidyPayments: 15,
    emergencyPurchases: 0,
    eventPenalties: 0,
    outagePenalties: 0,
    penalties: 0,
    eventReliabilityDelta: 0,
    outageReliabilityDelta: 0,
    eventCustomerDelta: 0,
    outageCustomerDelta: 0,
    capitalCustomerDelta: 0,
    profit: 0,
    reliabilityScore: 5,
    customerImpactScore: 5,
    notes: [],
  })) as SeasonState[];

  const assets = Object.fromEntries(
    assetsData.map((asset) => [
      asset.id,
      { ...asset, availableMw: asset.capacityMw, activeEffects: [] },
    ]),
  ) as Record<string, AssetState>;

  return {
    gameId: createGameId(),
    gameName: input?.gameName || "Workshop Utility",
    facilitatorName: input?.facilitatorName || "",
    seed: input?.seed || String(Date.now()),
    difficulty: input?.difficulty || "Standard",
    currentSeasonIndex: 0,
    seasons,
    assets,
    marketTrend: 0,
    permanentDemandChangeMw: 0,
    totalProfit: 0,
    totalCapitalInvested: 0,
    regulatoryTrust: 5,
    activeInvestments: [],
    activeProtections: [],
    settings: input?.settings || defaultSettings(),
  };
}

export function defaultSettings(): GameSettings {
  return {
    marketTrend: true,
    capitalInvestment: true,
    regulatoryTrust: true,
    manualRolls: true,
    autoRolls: true,
    allowDeficitSpending: false,
  };
}

export function defaultBudgetSelections() {
  return Object.fromEntries(assetsData.map((asset) => [asset.id, "standard"]));
}

export function currentSeason(game: GameState) {
  return game.seasons[game.currentSeasonIndex];
}

export function getBudgetOption(assetId: string, optionId: string) {
  return (budgetOptions as Record<string, Array<{ id: string; name: string; cost: number; efor: RiskLevel; effect: string }>>)[assetId].find((option) => option.id === optionId)!;
}

export function getFuelStrategy(fuelId: "coal" | "gas", optionId: string) {
  return (fuelStrategies as Record<string, Array<{ id: string; name: string; cost: number; effect: string }>>)[fuelId].find((option) => option.id === optionId)!;
}

export function getCapitalProject(projectId?: string) {
  return capitalProjects.find((project) => project.id === (projectId || "none"))!;
}

export function calculateBudgetSpend(season: SeasonState) {
  const budgetSpend = Object.entries(season.selectedBudgetOptions).reduce((sum, [assetId, optionId]) => sum + getBudgetOption(assetId, optionId).cost, 0);
  const fuelSpend = Object.entries(season.selectedFuelStrategies).reduce((sum, [fuelId, optionId]) => sum + getFuelStrategy(fuelId as "coal" | "gas", optionId).cost, 0);
  const capitalSpend = getCapitalProject(season.selectedCapitalProject).cost;
  return budgetSpend + fuelSpend + capitalSpend;
}

export function resolveAllRolls(game: GameState, manual?: Partial<Record<"market" | "demand" | "coal" | "gas" | "hydro", number>>): GameState {
  const next = structuredClone(game);
  const season = currentSeason(next);
  const turnSeed = `${next.seed}-${season.name}`;
  const marketRoll = manual?.market || rollD6(`${turnSeed}-market`);
  const demandRoll = manual?.demand || rollD6(`${turnSeed}-demand`);
  const coalRoll = manual?.coal || rollD6(`${turnSeed}-coal`);
  const gasRoll = manual?.gas || rollD6(`${turnSeed}-gas`);
  const hydroRoll = manual?.hydro || rollD6(`${turnSeed}-hydro`);
  const market = resolveMarketPrice(marketRoll, next.settings.marketTrend ? next.marketTrend : 0);
  const demand = resolveDemand(demandRoll, next.permanentDemandChangeMw);
  const hydro = marketTables.hydro.find((row) => row.rolls.includes(hydroRoll))!;
  season.marketPrice = market.price;
  season.demandMw = demand.demandMw;
  season.coalFuelCost = resolveFuelPrice("coal", coalRoll).cost;
  season.gasFuelCost = resolveFuelPrice("gas", gasRoll).cost;
  season.hydroAvailableMw = hydro.availableMw;
  season.eventDrawn = undefined;
  season.outageResults = {};
  season.derateResults = {};
  season.eventCapacityAdjustments = {};
  season.outageCapacityAdjustments = {};
  season.eventMarketMargin = 0;
  season.eventPenalties = 0;
  season.outagePenalties = 0;
  season.eventReliabilityDelta = 0;
  season.outageReliabilityDelta = 0;
  season.eventCustomerDelta = 0;
  season.outageCustomerDelta = 0;
  season.notes = [`Market: ${market.label} at $${market.price}/MWh`, `Demand: ${demand.label} at ${demand.demandMw.toLocaleString()} MW`, `Hydro: ${hydro.label} at ${hydro.availableMw} MW`];
  return recalculate(next);
}

export function applyEvent(game: GameState, eventId?: string): GameState {
  const next = structuredClone(game);
  const season = currentSeason(next);
  const id = eventId || "heatDome";
  season.eventDrawn = id;
  season.eventCapacityAdjustments = {};
  season.eventMarketMargin = 0;
  season.eventPenalties = 0;
  season.eventReliabilityDelta = 0;
  season.eventCustomerDelta = 0;
  const notes: string[] = [];
  const has = (asset: string, option: string) => season.selectedBudgetOptions[asset] === option || next.activeProtections.includes(option) || next.activeInvestments.includes(option);
  const addPenalty = (amount: number) => { season.eventPenalties += amount; };
  const addCapacity = (assetId: string, mw: number) => {
    season.eventCapacityAdjustments[assetId] = (season.eventCapacityAdjustments[assetId] || 0) + mw;
  };
  if (id === "heatDome") {
    season.demandMw = (season.demandMw || 6500) + 500;
    next.marketTrend += 1;
    if (!has("td", "hardening") && !next.activeInvestments.includes("gridHardening")) season.eventCustomerDelta -= 1;
    notes.push("Heat drove demand higher; hardened grid spend protected customer impact.");
  }
  if (id === "polarVortex") {
    season.demandMw = (season.demandMw || 6500) + 500;
    next.marketTrend += 1;
    if (season.selectedFuelStrategies.gas !== "transport" && !next.activeInvestments.includes("gasTransport")) addPenalty(30);
  }
  if (id === "dataCenterGrowth") {
    next.permanentDemandChangeMw += 500;
    next.marketTrend += 1;
    if (has("td", "datacenter") || next.activeInvestments.includes("dataCenterInterconnect")) season.eventMarketMargin += 20;
  }
  if (id === "gasPipelineConstraint") {
    next.marketTrend += 1;
    if (season.selectedFuelStrategies.gas !== "transport" && !next.activeInvestments.includes("gasTransport")) {
      addCapacity("gas", -700);
      addPenalty(30);
      notes.push("No firm transport: gas capacity derated 700 MW.");
    }
  }
  if (id === "coalSupplyDisruption") {
    next.marketTrend += 1;
    if (season.selectedFuelStrategies.coal !== "inventory") {
      addCapacity("coal", -500);
      addPenalty(20);
      season.eventCustomerDelta -= 1;
    }
  }
  if (id === "derecho" && !["standard", "hardening"].includes(season.selectedBudgetOptions.td) && !next.activeInvestments.includes("gridHardening")) {
    season.eventReliabilityDelta -= 2;
    addPenalty(40);
  }
  if (id === "mildWeather") {
    season.demandMw = Math.max(0, (season.demandMw || 6500) - 500);
    next.marketTrend -= 1;
    season.eventCustomerDelta += 1;
  }
  if (id === "efficiency") {
    next.permanentDemandChangeMw -= 200;
    next.marketTrend -= 1;
    season.eventCustomerDelta += 1;
  }
  if (id === "environment" && season.selectedBudgetOptions.coal !== "environmental") {
    addCapacity("coal", -300);
    addPenalty(40);
  }
  if (id === "forecastMiss" && season.selectedBudgetOptions.renewables !== "forecasting" && !next.activeInvestments.includes("forecastingTools")) {
    season.eventReliabilityDelta -= 1;
    season.eventCustomerDelta -= 1;
  }
  if (id === "strongRenewables") {
    season.subsidyPayments = 25;
    season.eventCustomerDelta += 1;
  }
  if (id === "curtailment") {
    season.subsidyPayments = has("renewables", "storage") || next.activeInvestments.includes("renewableStorage") ? 15 : 5;
  }
  season.notes.push(...notes);
  return recalculate(next);
}

export function resolveOutagesAndDerates(game: GameState): GameState {
  const next = structuredClone(game);
  const season = currentSeason(next);
  if (season.outageResults.nuclear?.occurred) next.regulatoryTrust += 2;
  season.outageResults = {};
  season.derateResults = {};
  season.outageCapacityAdjustments = {};
  season.outagePenalties = 0;
  season.outageReliabilityDelta = 0;
  season.outageCustomerDelta = 0;
  const addOutageCapacity = (assetId: string, mw: number) => {
    season.outageCapacityAdjustments[assetId] = (season.outageCapacityAdjustments[assetId] || 0) + mw;
  };
  for (const asset of Object.values(next.assets)) {
    const option = getBudgetOption(asset.id, season.selectedBudgetOptions[asset.id]);
    asset.eforRisk = option.efor;
    const strategy = operatingStrategies.find((item) => item.id === season.selectedOperatingStrategies[asset.id])!;
    const roll = rollD6(`${next.seed}-${season.name}-${asset.id}-outage`);
    const adjustedThreshold = clamp(riskThreshold[asset.eforRisk] + strategy.outageRollModifier, 0, 6);
    const outage = roll <= adjustedThreshold;
    const outageImpact = outageImpactFor(asset.id);
    season.outageResults[asset.id] = {
      roll,
      adjustedRoll: adjustedThreshold,
      occurred: outage,
      label: outage ? "Forced outage" : "No outage",
      capacityImpactMw: outage ? outageImpact.mw : 0,
      profitImpact: outage ? outageImpact.penalty : 0,
      notes: outage ? [outageImpact.note] : [`${asset.name} held through the season.`],
    };
    if (outage) {
      addOutageCapacity(asset.id, -outageImpact.mw);
      season.outagePenalties += outageImpact.penalty;
      season.outageReliabilityDelta -= outageImpact.reliability;
      if (asset.id === "td") season.outageCustomerDelta -= 2;
      if (asset.id === "nuclear") next.regulatoryTrust -= 2;
    }
    if (["defer", "min"].includes(option.id) || asset.condition <= 6) {
      const derateRoll = rollD6(`${next.seed}-${season.name}-${asset.id}-derate`);
      const result = derateRoll >= 6 ? "Major Derate" : derateRoll >= 4 ? "Small Derate" : "No Derate";
      const impact = derateImpactFor(asset.id, result);
      season.derateResults[asset.id] = {
        roll: derateRoll,
        occurred: result !== "No Derate",
        label: result,
        capacityImpactMw: impact.mw,
        profitImpact: impact.penalty,
        notes: [impact.note],
      };
      addOutageCapacity(asset.id, -impact.mw);
      season.outagePenalties += impact.penalty;
      if (impact.mw > 0) season.outageReliabilityDelta -= result === "Major Derate" ? 2 : 1;
    }
  }
  return recalculate(next);
}

export function recalculate(game: GameState): GameState {
  const next = structuredClone(game);
  const season = currentSeason(next);
  season.spend = calculateBudgetSpend(season);
  season.unspentBudget = season.budget - season.spend;
  const available = calculateAvailableCapacity(next);
  season.availableMw = available;
  const demand = season.demandMw || 6500;
  const price = String(season.marketPrice || 50) as keyof typeof scoringRules.marketMargin;
  let margin = Number(scoringRules.marketMargin[price] || 0);
  if (available < demand) margin = 0;
  else if (available < demand * 1.1) margin *= 0.5;
  if (season.selectedBudgetOptions.gas === "flex" && (season.marketPrice || 0) >= 100) margin += 15;
  margin += season.eventMarketMargin;
  season.marketMargin = margin;
  const shortfall = Math.max(0, demand - available);
  const emergency = scoringRules.emergencyPurchases.find((row) => shortfall >= row.min && shortfall <= row.max);
  season.emergencyPurchases = emergency ? emergency.penalty : 0;
  season.penalties = season.eventPenalties + season.outagePenalties;
  season.reliabilityScore = 5 + season.eventReliabilityDelta + season.outageReliabilityDelta;
  season.customerImpactScore = 5 + season.eventCustomerDelta + season.outageCustomerDelta + season.capitalCustomerDelta;
  if (shortfall > 0) {
    season.reliabilityScore = Math.min(season.reliabilityScore, shortfall > 1500 ? 1 : shortfall > 1000 ? 2 : 3);
    season.customerImpactScore = Math.min(season.customerImpactScore, shortfall > 1000 ? 2 : 3);
  }
  season.reliabilityScore = clamp(Math.round(season.reliabilityScore), 1, 5);
  season.customerImpactScore = clamp(Math.round(season.customerImpactScore), 1, 5);
  season.profit = season.unspentBudget + season.marketMargin + season.subsidyPayments - season.emergencyPurchases - season.penalties + Math.floor(next.totalCapitalInvested / 100) * 8;
  next.totalProfit = next.seasons.reduce((sum, item) => sum + (item.profit || 0), 0);
  next.marketTrend = clamp(next.marketTrend, -3, 3);
  return next;
}

export function applyCapitalProject(game: GameState, projectId: string): GameState {
  const next = structuredClone(game);
  const season = currentSeason(next);
  const prior = getCapitalProject(season.selectedCapitalProject);
  if (prior.id !== "none" && prior.id !== projectId) {
    next.totalCapitalInvested = Math.max(0, next.totalCapitalInvested - prior.cost);
    next.activeInvestments = next.activeInvestments.filter((id) => id !== prior.id);
  }
  const project = getCapitalProject(projectId);
  season.selectedCapitalProject = project.id;
  season.capitalCustomerDelta = 0;
  if (project.id !== "none" && !next.activeInvestments.includes(project.id)) {
    next.activeInvestments.push(project.id);
    next.totalCapitalInvested += project.cost;
  }
  if (project.id === "hydroModernization") next.assets.hydro.eforRisk = "Low";
  if (project.id === "coalReliability") next.assets.coal.eforRisk = improveRisk(next.assets.coal.eforRisk);
  if (next.totalCapitalInvested > 200 && !["coalReliability", "hydroModernization", "gridHardening", "renewableStorage"].includes(project.id)) {
    season.capitalCustomerDelta -= 1;
  }
  return recalculate(next);
}

export function advanceSeason(game: GameState): GameState {
  const next = structuredClone(game);
  if (next.currentSeasonIndex >= next.seasons.length - 1) return next;
  next.currentSeasonIndex += 1;
  for (const asset of Object.values(next.assets)) asset.availableMw = asset.capacityMw;
  next.assets.hydro.availableMw = currentSeason(next).hydroAvailableMw || 500;
  return recalculate(next);
}

export function finalRating(game: GameState) {
  const avgRel = average(game.seasons.map((s) => s.reliabilityScore));
  const avgCust = average(game.seasons.map((s) => s.customerImpactScore));
  if (game.totalProfit > 250 && avgRel >= 4 && avgCust >= 4) return "Excellent Operator";
  if (avgRel >= 4 && game.totalProfit < 150) return "Reliable but Expensive";
  if (game.totalProfit > 250 && avgRel < 3.5) return "Profitable but Risky";
  if (avgCust >= 4 && game.totalCapitalInvested < 150) return "Customer-Friendly but Under-Invested";
  if (avgRel <= 2 || avgCust <= 2) return "Blackout Learning Experience";
  return "Operational Trouble";
}

function calculateAvailableCapacity(game: GameState) {
  const season = currentSeason(game);
  return Object.values(game.assets).reduce((sum, asset) => {
    if (asset.id === "td") return sum;
    const strategy = operatingStrategies.find((item) => item.id === season.selectedOperatingStrategies[asset.id])!;
    const eventAdjustment = season.eventCapacityAdjustments[asset.id] || 0;
    const outageAdjustment = season.outageCapacityAdjustments[asset.id] || 0;
    let mw = Math.max(0, asset.id === "hydro" ? season.hydroAvailableMw || asset.capacityMw : asset.capacityMw);
    mw += eventAdjustment + outageAdjustment;
    if (asset.id === "renewables" && (season.selectedBudgetOptions.renewables === "storage" || game.activeInvestments.includes("renewableStorage"))) mw += 300;
    if (asset.id === "nuclear" && season.selectedBudgetOptions.nuclear === "enhanced" && (season.demandMw || 0) >= 8000) mw += 200;
    return sum + Math.round(mw * strategy.capacityMultiplier);
  }, 0);
}

function outageImpactFor(assetId: string) {
  const table: Record<string, { mw: number; penalty: number; reliability: number; note: string }> = {
    nuclear: { mw: 1000, penalty: 50, reliability: 2, note: "Nuclear outage removed 1,000 MW and triggered regulatory concern." },
    coal: { mw: 600, penalty: 25, reliability: 1, note: "Coal forced outage removed 600 MW." },
    gas: { mw: 500, penalty: 20, reliability: 1, note: "Gas forced outage removed 500 MW." },
    renewables: { mw: 300, penalty: 5, reliability: 1, note: "Renewable availability fell below plan." },
    hydro: { mw: 300, penalty: 10, reliability: 1, note: "Hydro forced outage reduced flexibility." },
    td: { mw: 0, penalty: 40, reliability: 3, note: "T&D failure created delivery constraints and customer pain." },
  };
  return table[assetId];
}

function derateImpactFor(assetId: string, result: string) {
  if (result === "No Derate") return { mw: 0, penalty: 0, note: "No derate." };
  const small = result === "Small Derate";
  const table: Record<string, [number, number]> = {
    nuclear: small ? [300, 10] : [700, 25],
    coal: small ? [300, 10] : [600, 20],
    gas: small ? [300, 10] : [500, 15],
    renewables: small ? [200, 5] : [500, 10],
    hydro: small ? [100, 5] : [300, 10],
    td: small ? [0, 20] : [0, 40],
  };
  const [mw, penalty] = table[assetId];
  return { mw, penalty, note: `${result} caused ${mw ? `${mw} MW of lost capacity` : "delivery constraints"}.` };
}

function improveRisk(risk: RiskLevel): RiskLevel {
  return riskOrder[Math.max(0, riskOrder.indexOf(risk) - 1)];
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function createGameId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `game-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
