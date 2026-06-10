const SAVE_KEY = "electron-to-market-static-save";
const STEPS = ["rolls", "budget", "fuel", "ops", "capital", "event", "outages", "results"];
const COLORS = { nuclear: "#7c3aed", coal: "#4b3023", gas: "#2563eb", renewables: "#16a34a", hydro: "#0891b2", td: "#f97316" };
const CUTSCENES = {
  peakWin: {
    image: "assets/cutscenes/peak-season-win.png",
    title: "Peak Captured",
    narration: "Preparation paid off: the system met peak demand and captured market upside.",
  },
  reliabilityCrisis: {
    image: "assets/cutscenes/reliability-crisis.png",
    title: "Reliability Crisis",
    narration: "Deferred risk turned into real operating stress.",
  },
  stormResponse: {
    image: "assets/cutscenes/storm-response.png",
    title: "Customers Feel It",
    narration: "Grid readiness and storm response shaped the customer experience.",
  },
  missedOpportunity: {
    image: "assets/cutscenes/missed-opportunity.png",
    title: "Opportunity Missed",
    narration: "The market was there, but the system was not ready to capture it.",
  },
  prepSuccess: {
    image: "assets/cutscenes/prep-success.png",
    title: "Ready for Peak",
    narration: "The teams built useful optionality before demand arrived.",
  },
  prepFailure: {
    image: "assets/cutscenes/prep-failure.png",
    title: "Risk Carried Forward",
    narration: "Deferred work may become tomorrow's outage, derate, or missed market upside.",
  },
};

const TRUCK_SVG = `<svg viewBox="0 0 64 30" aria-hidden="true"><rect x="1" y="13" width="36" height="9" rx="2"/><path d="M37 13h12l9 7v2H37z"/><circle cx="12" cy="25" r="4.5"/><circle cx="48" cy="25" r="4.5"/><path d="M8 14L20 4l3 2.4-10 8.4z"/><rect x="19" y="1" width="10" height="5" rx="2"/></svg>`;

const CREW = [
  { asset: "nuclear", name: "Dana Okafor", title: "Nuclear Plant Manager" },
  { asset: "coal", name: "Walt Brzezinski", title: "Coal Fleet Superintendent" },
  { asset: "gas", name: "Priya Raman", title: "Gas Operations Lead" },
  { asset: "renewables", name: "Mateo Vega", title: "Renewables Director" },
  { asset: "hydro", name: "June Tallchief", title: "Hydro Station Chief" },
  { asset: "td", name: "Gus Lindqvist", title: "Grid Dispatch Chief" },
];

const OUTAGE_QUOTES = {
  nuclear: 'Dana Okafor: "The unit is down. The paperwork will be considerable."',
  coal: 'Walt Brzezinski: "She\'s been making that noise since March. Today the noise won."',
  gas: 'Priya Raman: "Turbine tripped. Hot gas path, cold reality."',
  renewables: 'Mateo Vega: "The forecast promised wind. The atmosphere declined."',
  hydro: 'June Tallchief: "Gate three is stuck, and the river does not care about our quarter."',
  td: 'Gus Lindqvist: "The phones are lit up like the storm map."',
};

const DISPATCH_LINES = {
  rolls: [
    "The forecast desk has produced a forecast. They stand by it, mostly.",
    "Weather model run #47 disagrees with run #46. Roll the dice.",
    "Dispatch reports the market is doing things again.",
  ],
  budget: [
    "Every team believes their asset is the important one. They are each correct.",
    "Maintenance deferred is profit today and a story later.",
    "The spreadsheet is watching.",
  ],
  fuel: [
    "The gas desk wants a hedge. The CFO wants a miracle. Pick one.",
    "The coal pile looks fine from the office window.",
    "Spot prices: an adventure every single day.",
  ],
  ops: [
    "Run them hard or run them long. Rarely both.",
    "Aggressive is a strategy right up until it is an incident report.",
    "The turbines do not read the operating plan. They feel it.",
  ],
  capital: [
    "The capital committee meets at two. Bring donuts and a one-pager.",
    "Every project is critical. The budget is not.",
    "Rate base today, reliability tomorrow. Allegedly.",
  ],
  event: [
    "Something is happening in the service territory.",
    "The control room phone is ringing. It is never good news.",
    "The sky has opinions this season.",
  ],
  outages: [
    "Time to find out which deferrals were load-bearing.",
    "Every machine is honest eventually.",
    "The fleet reports in. Some of it, anyway.",
  ],
  results: [
    "The quarter closes. The numbers do not negotiate.",
    "Finance has questions. Operations has answers. They are different.",
    "What the season took, the debrief explains.",
  ],
};

const DILEMMAS = [
  {
    id: "squirrel",
    title: "Visitor at Substation 7",
    text: "A squirrel is sizing up the 138 kV bus at Substation 7. Field crews are 40 minutes out.",
    choices: [
      { label: "Dispatch a crew now", detail: "-$5M, certain outcome", profit: -5, log: "Crew dispatched. The squirrel was escorted off the property with honors." },
      { label: "Trust the squirrel", detail: "Free. Squirrels are not signatories to the reliability standards.", risk: { threshold: 3, success: { log: "The squirrel lost interest and left. Nothing happened. You feel lucky, not good." }, failure: { profit: -15, reliability: -1, log: "The squirrel was not trustworthy. Substation 7 tripped and 40,000 customers blinked." } } },
    ],
  },
  {
    id: "vibration",
    title: "Vibration Alarm at Unit 2",
    text: "Unit 2 is vibrating in a way the manual describes as 'investigate promptly.' A planned outage window costs money. Running it costs nerve.",
    choices: [
      { label: "Take the outage window", detail: "-$8M, fix it on your schedule", profit: -8, log: "Bearing replaced during a controlled window. Unit 2 purrs. The manual is smug." },
      { label: "Run it and monitor", detail: "Free, if the bearing agrees", risk: { threshold: 3, success: { log: "The vibration settled. The night shift named the bearing 'Lucky.'" }, failure: { profit: -20, reliability: -1, log: "The bearing chose violence. Unit 2 came down hard, on its own schedule." } } },
    ],
  },
  {
    id: "mutualAid",
    title: "Mutual Aid Request",
    text: "A neighboring utility is getting hammered and asks to borrow two line crews for the week.",
    choices: [
      { label: "Send the crews", detail: "-$5M, goodwill banked", profit: -5, customers: 1, log: "Crews sent. They came back tired, with stories and a very nice thank-you letter." },
      { label: "Politely decline", detail: "Free, but word gets around", risk: { threshold: 4, success: { log: "You kept your crews home. Nobody noticed. This time." }, failure: { customers: -1, log: "Word got around that you declined. Your next mutual aid request will be reviewed slowly." } } },
    ],
  },
  {
    id: "phishing",
    title: "Suspicious Email at the Control Center",
    text: "An operator reports an email titled 'Invoice_Final_v2.exe' from a vendor you do not use. IT wants a security stand-down.",
    choices: [
      { label: "Run the stand-down", detail: "-$5M of lost time, certain outcome", profit: -5, log: "Stand-down complete. Three more copies found and quarantined. IT accepts gratitude in pizza." },
      { label: "Carry on, it's probably nothing", detail: "Free, probably", risk: { threshold: 3, success: { log: "It was, in fact, nothing. The operator deleted it and went back to work." }, failure: { profit: -15, log: "The attachment was not an invoice. Forensics, lawyers, and a very quiet all-hands followed." } } },
    ],
  },
  {
    id: "spareTransformer",
    title: "Spare Transformer Auction",
    text: "A regional spare transformer is up for sale. You do not need it today. That is exactly how needing one starts.",
    choices: [
      { label: "Buy the spare", detail: "-$10M, it sits in the yard radiating preparedness", profit: -10, log: "Spare purchased. It sits in the yard, radiating preparedness." },
      { label: "Pass on it", detail: "Free, transformers rarely fail. Rarely.", risk: { threshold: 3, success: { log: "Nothing failed. The yard stays empty and the budget stays whole." }, failure: { profit: -20, log: "Three weeks later you needed it. Expedited overseas shipping for 200 tons is not cheap." } } },
    ],
  },
  {
    id: "internModel",
    title: "The Intern's Forecast",
    text: "An intern's load model disagrees with the official forecast by 400 MW. The intern is nervous but did show their work.",
    choices: [
      { label: "Re-run the plan", detail: "-$3M of staff time", profit: -3, log: "The intern was right. The plan was adjusted quietly and the intern got a coffee card." },
      { label: "Trust the official model", detail: "Free. It has a committee.", risk: { threshold: 3, success: { log: "The official model held. The intern's model goes in a drawer, for now." }, failure: { reliability: -1, log: "The intern was right. The intern knows it, too." } } },
    ],
  },
  {
    id: "droneOffer",
    title: "Drone Inspection Pilot",
    text: "A vendor offers a drone inspection sweep of your transmission corridors before the peak.",
    choices: [
      { label: "Fund the sweep", detail: "-$5M, find problems before they find you", profit: -5, log: "The drone found a cracked insulator before the insulator found you. Money well spent." },
      { label: "Skip it this season", detail: "Free; binoculars built this industry", risk: { threshold: 4, success: { log: "The corridors held. The binoculars remain undefeated." }, failure: { customers: -1, log: "A flashover on an un-inspected span clipped service to two towns during dinner." } } },
    ],
  },
  {
    id: "reporterTour",
    title: "Reporter Requests a Plant Tour",
    text: "A local reporter wants a tour and an interview about grid readiness. Legal sighs audibly.",
    choices: [
      { label: "Host the tour", detail: "-$2M of prep and polish, good press", profit: -2, customers: 1, log: "The story ran with a photo of the control room and the word 'vigilant.' Legal exhaled." },
      { label: "Decline the request", detail: "Free, but reporters write either way", risk: { threshold: 4, success: { log: "The story never ran. News cycles are merciful sometimes." }, failure: { customers: -1, log: "The story ran anyway, with stock photos of smokestacks and the word 'declined.'" } } },
    ],
  },
];

const DATA = {
  seasons: [
    { name: "Spring", budget: 100, role: "Prepare for Summer", prepares: "Summer", stressDemandBonus: 0, peakMarginMultiplier: 1 },
    { name: "Summer", budget: 150, role: "Summer Peak Run", preparedBy: "Spring", stressDemandBonus: 700, peakMarginMultiplier: 1.55 },
    { name: "Fall", budget: 100, role: "Prepare for Winter", prepares: "Winter", stressDemandBonus: 0, peakMarginMultiplier: 1 },
    { name: "Winter", budget: 150, role: "Winter Peak Run", preparedBy: "Fall", stressDemandBonus: 800, peakMarginMultiplier: 1.65 },
  ],
  assets: [
    { id: "nuclear", name: "Nuclear", capacityMw: 2000, role: "Baseload", condition: 8, eforRisk: "Low", derateRisk: "Low" },
    { id: "coal", name: "Coal", capacityMw: 2500, role: "Dispatchable", condition: 6, eforRisk: "Medium", derateRisk: "Medium" },
    { id: "gas", name: "Natural Gas", capacityMw: 2000, role: "Flexible / Peaking", condition: 7, eforRisk: "Medium-Low", derateRisk: "Medium" },
    { id: "renewables", name: "Renewables", capacityMw: 1500, role: "Variable", condition: 7, eforRisk: "Medium-Low", derateRisk: "Weather" },
    { id: "hydro", name: "Hydro", capacityMw: 500, role: "Flexible", condition: 8, eforRisk: "Low", derateRisk: "Water" },
    { id: "td", name: "T&D / Grid", capacityMw: 0, role: "Delivery", condition: 6, eforRisk: "Medium", derateRisk: "Storm" },
  ],
  market: [
    { roll: 1, label: "Low Price", price: 30, margin: 0 },
    { roll: 2, label: "Soft Market", price: 40, margin: 5 },
    { roll: 3, label: "Normal Market", price: 50, margin: 10 },
    { roll: 4, label: "Strong Market", price: 70, margin: 20 },
    { roll: 5, label: "Scarcity", price: 100, margin: 40 },
    { roll: 6, label: "Extreme Scarcity", price: 150, margin: 75 },
  ],
  demand: [
    { roll: 1, label: "Very Low", demandMw: 5500 },
    { roll: 2, label: "Low", demandMw: 6000 },
    { roll: 3, label: "Normal", demandMw: 6500 },
    { roll: 4, label: "High", demandMw: 7000 },
    { roll: 5, label: "Very High", demandMw: 8000 },
    { roll: 6, label: "Extreme", demandMw: 9000 },
  ],
  coalFuel: [20, 25, 30, 35, 45, 60],
  gasFuel: [25, 35, 45, 60, 90, 140],
  hydro: [
    { rolls: [1], label: "Drought", availableMw: 100 },
    { rolls: [2], label: "Low Water", availableMw: 250 },
    { rolls: [3, 4], label: "Normal", availableMw: 400 },
    { rolls: [5, 6], label: "Strong Water", availableMw: 500 },
  ],
  budgetOptions: {
    nuclear: [
      { id: "min", name: "Minimum Spend", cost: 10, efor: "Medium", effect: "EFOR becomes Medium" },
      { id: "standard", name: "Standard Maintenance", cost: 25, efor: "Low", effect: "EFOR stays Low" },
      { id: "enhanced", name: "Enhanced Outage Work", cost: 40, efor: "Low", effect: "Low EFOR; +200 MW next stress season" },
      { id: "defer", name: "Defer Work", cost: 0, efor: "High", effect: "EFOR becomes High" },
    ],
    coal: [
      { id: "min", name: "Minimum Maintenance", cost: 15, efor: "Medium", effect: "EFOR Medium" },
      { id: "standard", name: "Standard Maintenance", cost: 30, efor: "Medium-Low", effect: "EFOR Medium-Low" },
      { id: "boiler", name: "Boiler Reliability Work", cost: 45, efor: "Low", effect: "EFOR Low" },
      { id: "environmental", name: "Environmental Work", cost: 25, efor: "Medium", effect: "Avoid compliance derate" },
      { id: "defer", name: "Defer Work", cost: 0, efor: "High", effect: "EFOR High" },
    ],
    gas: [
      { id: "min", name: "Minimum Maintenance", cost: 10, efor: "Medium", effect: "EFOR Medium" },
      { id: "standard", name: "Standard Maintenance", cost: 20, efor: "Medium-Low", effect: "EFOR Medium-Low" },
      { id: "major", name: "Major Work / Hot Gas Path", cost: 35, efor: "Low", effect: "EFOR Low" },
      { id: "flex", name: "Flexibility Upgrade", cost: 25, efor: "Medium-Low", effect: "Extra value in high-price market" },
      { id: "defer", name: "Defer Work", cost: 0, efor: "High", effect: "EFOR High" },
    ],
    renewables: [
      { id: "min", name: "Minimum Maintenance", cost: 5, efor: "Medium", effect: "Weather underperformance risk" },
      { id: "standard", name: "Standard Maintenance", cost: 15, efor: "Medium-Low", effect: "Normal availability" },
      { id: "forecasting", name: "Forecasting Tools", cost: 20, efor: "Medium-Low", effect: "Avoid forecast miss penalty" },
      { id: "storage", name: "Storage Support", cost: 50, efor: "Low", effect: "Add 300 MW during peak" },
      { id: "defer", name: "Defer Work", cost: 0, efor: "High", effect: "Derate risk increases" },
    ],
    hydro: [
      { id: "min", name: "Minimum Maintenance", cost: 5, efor: "Medium", effect: "EFOR Medium" },
      { id: "standard", name: "Standard Maintenance", cost: 12, efor: "Low", effect: "EFOR Low" },
      { id: "dam", name: "Dam/Gate Reliability Work", cost: 25, efor: "Low", effect: "Avoid hydro outage" },
      { id: "defer", name: "Defer Work", cost: 0, efor: "High", effect: "EFOR High" },
    ],
    td: [
      { id: "min", name: "Minimum Spend", cost: 20, efor: "Medium", effect: "Storm penalty likely" },
      { id: "standard", name: "Standard Reliability Work", cost: 40, efor: "Medium-Low", effect: "Normal storm response" },
      { id: "hardening", name: "Grid Hardening", cost: 70, efor: "Low", effect: "Avoid major storm penalty" },
      { id: "datacenter", name: "Data Center Interconnect", cost: 60, efor: "Medium-Low", effect: "Future demand/profit opportunity" },
      { id: "defer", name: "Defer Work", cost: 0, efor: "High", effect: "Reliability risk increases" },
    ],
  },
  fuelStrategies: {
    coal: [
      { id: "spot", name: "Spot Coal", cost: 0, effect: "Pay rolled coal price" },
      { id: "half", name: "50% Contracted", cost: 10, effect: "Half coal fuel fixed at $32/MWh" },
      { id: "full", name: "100% Contracted", cost: 20, effect: "Coal fuel fixed at $35/MWh" },
      { id: "inventory", name: "Extra Coal Inventory", cost: 15, effect: "Avoid one coal supply shock" },
    ],
    gas: [
      { id: "spot", name: "Spot Gas", cost: 0, effect: "Pay rolled gas price" },
      { id: "half", name: "50% Contracted", cost: 15, effect: "Half gas fixed at $50/MWh" },
      { id: "full", name: "100% Contracted", cost: 30, effect: "Gas fixed at $55/MWh" },
      { id: "hedge", name: "Financial Hedge", cost: 15, effect: "Caps gas price at $70/MWh" },
      { id: "transport", name: "Firm Transport", cost: 20, effect: "Avoids one gas constraint event" },
    ],
  },
  operatingStrategies: [
    { id: "conservative", name: "Conservative", capacityMultiplier: .9, outageRollModifier: -1, effect: "-10% MW; outage roll improves" },
    { id: "normal", name: "Normal", capacityMultiplier: 1, outageRollModifier: 0, effect: "No change" },
    { id: "aggressive", name: "Aggressive", capacityMultiplier: 1.1, outageRollModifier: 1, effect: "+10% MW; outage roll worsens" },
  ],
  events: [
    { id: "heatDome", name: "Heat Dome", effect: "Demand +500 MW, Market Trend +1; grid hardening protects customers." },
    { id: "polarVortex", name: "Polar Vortex", effect: "Demand +500 MW, gas constraint risk, Market Trend +1." },
    { id: "dataCenterGrowth", name: "Data Center Growth", effect: "Permanent demand +500 MW, Market Trend +1; interconnect creates profit opportunity." },
    { id: "gasPipelineConstraint", name: "Gas Pipeline Constraint", effect: "Without firm transport, gas derates 700 MW and Profit -$30M." },
    { id: "coalSupplyDisruption", name: "Coal Supply Disruption", effect: "Without inventory, coal derates 500 MW and Profit -$20M." },
    { id: "derecho", name: "Thunderstorm / Derecho", effect: "Weak grid spend hurts reliability and profit." },
    { id: "mildWeather", name: "Mild Weather", effect: "Demand -500 MW, Market Trend -1, Customer Impact +1." },
    { id: "efficiency", name: "Energy Efficiency Program", effect: "Permanent demand -200 MW, Customer Impact +1, Market Trend -1." },
    { id: "environment", name: "Environmental Compliance Issue", effect: "Coal environmental work avoids derate and Profit -$40M." },
    { id: "forecastMiss", name: "Forecast Miss", effect: "Forecasting tools avoid Reliability -1 and Customer Impact -1." },
    { id: "strongRenewables", name: "Strong Renewable Output", effect: "Renewables payment +$25M, Customer Impact +1." },
    { id: "curtailment", name: "Renewable Curtailment", effect: "Renewables payment only +$5M; storage mitigates." },
  ],
  capitalProjects: [
    { id: "none", name: "No Capital Project", cost: 0, effect: "Preserve budget flexibility." },
    { id: "coalReliability", name: "Coal Reliability Project", cost: 75, effect: "Coal EFOR improves one level." },
    { id: "gasTransport", name: "Gas Firm Transport Package", cost: 60, effect: "Avoid gas constraint event." },
    { id: "nuclearExcellence", name: "Nuclear Outage Excellence", cost: 80, effect: "Avoid one nuclear outage extension." },
    { id: "renewableStorage", name: "Renewable Storage Project", cost: 100, effect: "Add 300 MW during peak." },
    { id: "hydroModernization", name: "Hydro Modernization", cost: 50, effect: "Hydro EFOR Low for rest of game." },
    { id: "gridHardening", name: "Grid Hardening", cost: 100, effect: "Avoid one storm/T&D event." },
    { id: "forecastingTools", name: "Forecasting / Dispatch Tools", cost: 40, effect: "Forecast risk improves." },
    { id: "dataCenterInterconnect", name: "Data Center Interconnect", cost: 120, effect: "Future demand/profit opportunity." },
  ],
};

let screen = "home";
let selectedEventId = "heatDome";
let lastTrailPct = null;
let lastDispatchKey = "";
let rollInputs = { demand: 3, coal: 3, gas: 3, hydro: 4 };
let game = loadGame() || createNewGame();
if (loadGame()) screen = "play";

document.addEventListener("click", handleClick);
document.addEventListener("change", handleChange);
document.addEventListener("keydown", handleKeydown);
preloadCutsceneImages();
render();
if (new URLSearchParams(location.search).has("smoke")) runSmokeTest();

function preloadCutsceneImages() {
  for (const scene of Object.values(CUTSCENES)) {
    const img = new Image();
    img.src = scene.image;
  }
}

function handleKeydown(event) {
  if (!["Enter", "Escape", " "].includes(event.key)) return;
  if (game.pendingCutscene) {
    event.preventDefault();
    dismissCutscene();
    render();
    return;
  }
  if (screen !== "play") return;
  const s = season();
  if (s.dilemmaId && s.dilemmaChoice != null && !s.dilemmaAcked) {
    event.preventDefault();
    acknowledgeDilemma();
    render();
  }
}

function showToast(message) {
  document.querySelector(".toast")?.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.append(toast);
  setTimeout(() => toast.remove(), 1900);
}

function createNewGame(setup = {}) {
  const seasons = DATA.seasons.map((season) => ({
    name: season.name,
    budget: season.budget,
    selectedBudgetOptions: Object.fromEntries(DATA.assets.map((asset) => [asset.id, "standard"])),
    selectedFuelStrategies: { coal: "spot", gas: "spot" },
    selectedOperatingStrategies: Object.fromEntries(DATA.assets.map((asset) => [asset.id, "normal"])),
    selectedCapitalProject: "none",
    eventDrawn: "",
    eventApplied: false,
    cutscenesShown: {},
    permanentDemandDelta: 0,
    marketTrendDelta: 0,
    rolls: {},
    outageResults: {},
    derateResults: {},
    eventCapacityAdjustments: {},
    outageCapacityAdjustments: {},
    spend: 0,
    unspentBudget: season.budget,
    marketMargin: 0,
    eventMarketMargin: 0,
    operatingBonus: 0,
    fuelCostExpense: 0,
    grossMarketRevenue: 0,
    fuelDispatch: { coalMw: 0, gasMw: 0, coalCost: 0, gasCost: 0 },
    priceFormation: [],
    peakReadinessScore: 0,
    peakReadinessRevenue: 0,
    peakReadinessPenalty: 0,
    seasonalStressDemandBonus: 0,
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
    availableMw: 0,
    stageLog: [],
    notes: [],
  }));
  return recalculate({
    gameId: `game-${Date.now()}`,
    gameName: setup.gameName || "Workshop Utility",
    facilitatorName: setup.facilitatorName || "",
    seed: setup.seed || String(Date.now()),
    difficulty: setup.difficulty || "Standard",
    currentSeasonIndex: 0,
    currentStep: "rolls",
    seasons,
    marketTrend: 0,
    permanentDemandChangeMw: 0,
    pendingCutscene: null,
    regulatoryTrust: 5,
    totalProfit: 0,
    totalCapitalInvested: 0,
    settings: {
      marketTrend: true,
      capitalInvestment: true,
      regulatoryTrust: true,
      manualRolls: true,
      autoRolls: true,
      fieldDispatches: true,
      allowDeficitSpending: false,
      ...(setup.settings || {}),
    },
  });
}

function handleClick(event) {
  const button = event.target.closest("button");
  if (!button) return;
  const action = button.dataset.action;
  if (!action) return;
  if (action === "home") screen = "home";
  if (action === "dismiss-cutscene") dismissCutscene();
  if (action === "dilemma-choice") chooseDilemma(Number(button.dataset.index));
  if (action === "dilemma-ack") acknowledgeDilemma();
  if (action === "how") screen = "how";
  if (action === "setup") screen = "setup";
  if (action === "start") startFromSetup();
  if (action === "load") { const loaded = loadGame(); if (loaded) { game = loaded; screen = "play"; } }
  if (action === "reset") {
    if (!confirm("Reset the game and clear the saved session? This cannot be undone.")) return;
    localStorage.removeItem(SAVE_KEY);
    game = createNewGame();
    screen = "home";
  }
  if (action === "save") { saveGame(); showToast("Game saved"); }
  if (action === "step") game.currentStep = button.dataset.step;
  if (action === "next") nextStep();
  if (action === "auto-rolls") { resolveRolls(); saveGame(); }
  if (action === "manual-rolls") { resolveRolls(rollInputs); saveGame(); }
  if (action === "roll-one") { rollInputs[button.dataset.roll] = Math.floor(Math.random() * 6) + 1; }
  if (action === "budget") selectBudget(button.dataset.asset, button.dataset.option);
  if (action === "fuel") selectFuel(button.dataset.fuel, button.dataset.option);
  if (action === "ops") selectOps(button.dataset.asset, button.dataset.option);
  if (action === "capital") selectCapital(button.dataset.project);
  if (action === "select-event") selectedEventId = button.dataset.event;
  if (action === "apply-event") applyEvent(selectedEventId);
  if (action === "random-event") applyEvent(DATA.events[Math.floor(Math.random() * DATA.events.length)].id);
  if (action === "outages") resolveOutages();
  if (action === "year-end") screen = "yearEnd";
  render();
  if (["step", "next", "year-end", "start", "home", "how", "setup"].includes(action)) window.scrollTo({ top: 0, behavior: "smooth" });
}

function handleChange(event) {
  const target = event.target;
  if (target.classList.contains("roll-input")) rollInputs[target.dataset.roll] = Number(target.value);
}

function startFromSetup() {
  const settings = {};
  for (const key of ["marketTrend", "capitalInvestment", "regulatoryTrust", "manualRolls", "autoRolls", "fieldDispatches", "allowDeficitSpending"]) {
    settings[key] = document.querySelector(`[name="${key}"]`)?.checked || false;
  }
  game = createNewGame({
    gameName: valueOf("gameName") || "Workshop Utility",
    facilitatorName: valueOf("facilitatorName"),
    seed: valueOf("seed") || String(Date.now()),
    difficulty: valueOf("difficulty") || "Standard",
    settings,
  });
  screen = "play";
  saveGame();
}

function render() {
  const app = document.querySelector("#app");
  app.innerHTML = `${header()}<main>${mainContent()}</main>${saveControls()}${renderDilemma()}${renderCutscene()}`;
  if (game.pendingCutscene) app.querySelector(".cutscene-copy button")?.focus();
  else app.querySelector('[data-action="dilemma-ack"]')?.focus();
  animateTrail(app);
}

function animateTrail(app) {
  const truck = app.querySelector(".trail-truck");
  const bar = app.querySelector(".trail-progress");
  if (!truck || !bar) { lastTrailPct = null; return; }
  const target = parseFloat(truck.style.left);
  if (lastTrailPct !== null && Math.abs(lastTrailPct - target) > 0.01) {
    truck.style.transition = "none";
    bar.style.transition = "none";
    truck.style.left = `${lastTrailPct}%`;
    bar.style.width = `${lastTrailPct}%`;
    truck.getBoundingClientRect();
    truck.style.transition = "";
    bar.style.transition = "";
    truck.style.left = `${target}%`;
    bar.style.width = `${target}%`;
  }
  lastTrailPct = target;
}

function header() {
  return `
    <header class="topbar">
      <div><div class="eyebrow">Facilitator-Led Utility Operations Simulation</div><h1>Electron to Market</h1></div>
      <div class="header-meta"><span>${escapeHtml(game.gameName)}</span><span>${game.difficulty}</span><span>${escapeHtml(game.facilitatorName || "Facilitator")}</span></div>
    </header>`;
}

function mainContent() {
  if (screen === "home") return homeScreen();
  if (screen === "how") return howScreen();
  if (screen === "setup") return setupScreen();
  if (screen === "yearEnd") return `${yearTrail(true)}${yearEndScreen()}`;
  return `${yearTrail()}${stepper()}${dashboard()}${operationsBoard()}${stagePanel()}${stepContent()}${notesPanel()}`;
}

function yearTrail(done = false) {
  const totalSteps = DATA.seasons.length * STEPS.length;
  const index = game.currentSeasonIndex * STEPS.length + STEPS.indexOf(game.currentStep);
  const pct = done ? 100 : Math.min(100, ((index + 0.5) / totalSteps) * 100);
  const stops = DATA.seasons.map((item, i) => {
    const left = ((i * STEPS.length + 0.5) / totalSteps) * 100;
    const state = done || i < game.currentSeasonIndex ? "passed" : i === game.currentSeasonIndex ? "here" : "";
    return `<div class="trail-stop ${state} ${item.prepares ? "prep" : "peak"}" style="left:${left}%"><i></i><span>${item.name}</span></div>`;
  }).join("");
  const dispatchKey = done ? "year-done" : `${season().name}-${game.currentStep}`;
  const animateDispatch = dispatchKey !== lastDispatchKey;
  lastDispatchKey = dispatchKey;
  return `
    <section class="trail" aria-label="Year progress">
      <div class="trail-road">
        <div class="trail-progress" style="width:${pct}%"></div>
        ${stops}
        <div class="trail-stop ${done ? "passed here" : ""} end" style="left:100%"><i></i><span>Year End</span></div>
        <div class="trail-truck" style="left:${pct}%">${TRUCK_SVG}</div>
      </div>
      <p class="trail-dispatch ${animateDispatch ? "" : "static"}"><em>Dispatch:</em> <span>${escapeHtml(dispatchLine(done))}</span></p>
    </section>`;
}

function dispatchLine(done = false) {
  if (done) return "Four seasons, one fleet, and a truck that has earned the depot. Debrief below.";
  if (game.settings.fieldDispatches === false) return `${season().name}: ${seasonConfig(season().name).role}.`;
  const pool = DISPATCH_LINES[game.currentStep] || DISPATCH_LINES.rolls;
  return pool[rollD6(`${game.seed}-${season().name}-${game.currentStep}-dispatch`) % pool.length];
}

function homeScreen() {
  return `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Corporate workshop simulation</p>
        <h2>Run a regulated utility through one year of uncertainty.</h2>
        <p>Allocate real-dollar budgets, hedge fuel, set operating posture, handle outages, and see how profit, reliability, and customers move together.</p>
        <div class="button-row">
          <button data-action="setup">Start New Game</button>
          <button class="secondary" data-action="load">Load Saved Game</button>
          <button class="ghost" data-action="how">How to Play</button>
        </div>
      </div>
      <div class="fleet-board">${DATA.assets.map((asset) => `<div class="fleet-line"><span style="background:${COLORS[asset.id]}"></span><strong>${asset.name}</strong><em>${asset.capacityMw ? formatMw(asset.capacityMw) : "Delivery system"}</em></div>`).join("")}</div>
    </section>`;
}

function setupScreen() {
  return `
    <section class="panel">
      <h2>Game Setup</h2>
      <div class="form-grid">
        <label>Game name<input name="gameName" value="Workshop Utility"></label>
        <label>Facilitator<input name="facilitatorName"></label>
        <label>Random seed<input name="seed" value="${Date.now()}"></label>
        <label>Difficulty<select name="difficulty"><option>Intro</option><option selected>Standard</option><option>Chaos</option></select></label>
      </div>
      <div class="toggle-grid">${["marketTrend", "capitalInvestment", "regulatoryTrust", "manualRolls", "autoRolls", "fieldDispatches", "allowDeficitSpending"].map((key) => `<label class="toggle"><input type="checkbox" name="${key}" ${key !== "allowDeficitSpending" ? "checked" : ""}>${labelize(key)}</label>`).join("")}</div>
      <button data-action="start">Start Game</button>
    </section>`;
}

function howScreen() {
  return `<section class="panel how">
    <h2>How to Play</h2>
    <div class="how-grid">
      <div class="summary">
        <h3>The Season Loop</h3>
        <p>Each season, run the eight stages in order on the projector:</p>
        <ol>
          <li><strong>Rolls</strong> — set demand, market price, fuel costs, and hydro conditions.</li>
          <li><strong>Budget</strong> — each asset team funds (or defers) maintenance.</li>
          <li><strong>Fuel</strong> — contract, hedge, or ride spot prices for coal and gas.</li>
          <li><strong>Ops</strong> — set conservative, normal, or aggressive operating posture.</li>
          <li><strong>Capital</strong> — management approves at most one capital project.</li>
          <li><strong>Event</strong> — draw an event card and see whose prep pays off.</li>
          <li><strong>Outages</strong> — risk turns into forced outages and derates.</li>
          <li><strong>Results</strong> — profit, reliability, and customer impact land.</li>
        </ol>
        <p>Every dollar not spent can become profit, but underspending creates derates, forced outages, emergency purchases, customer pain, and future reliability risk.</p>
      </div>
      <div class="summary">
        <h3>The Prep / Peak Year</h3>
        <p><strong>Spring prepares Summer. Fall prepares Winter.</strong> Prep-season choices become a readiness score (0–16) that carries into the next peak season.</p>
        <ul>
          <li>Strong readiness (11+) earns peak readiness revenue when demand spikes.</li>
          <li>Weak readiness (6 or less) creates missed-prep penalties, lost margin, and reliability damage.</li>
          <li>Peak seasons add 700–800 MW of stress demand and pay a higher market margin multiplier.</li>
        </ul>
        <p>Big moments trigger cutscenes, and one Field Dispatch dilemma lands each season right after the rolls — give the room 60 seconds to vote before choosing. Both can be paused on any screen; nothing advances until you click Continue. (Field Dispatches can be switched off in Game Setup for a strictly-business session.)</p>
      </div>
      <div class="summary">
        <h3>Breaking Up Teams</h3>
        <p>Built for 12–30 participants. Split the room into six asset teams that own their card each season:</p>
        <ul>
          <li><strong>Nuclear</strong> — baseload reliability and regulatory exposure.</li>
          <li><strong>Coal</strong> — boiler reliability, environmental work, fuel inventory.</li>
          <li><strong>Natural Gas</strong> — flexibility, hedging, firm transport.</li>
          <li><strong>Renewables</strong> — forecasting, storage, weather risk.</li>
          <li><strong>Hydro</strong> — low-cost flexibility and water conditions.</li>
          <li><strong>T&amp;D / Grid</strong> — storm hardening and customer experience.</li>
        </ul>
        <p><strong>Smaller groups (6–11):</strong> pair Coal+Gas and Renewables+Hydro into two teams. <strong>Larger groups:</strong> add a Fuel Desk team for the coal/gas contracting stage and a CFO team that owns the capital decision.</p>
        <p>Each stage: give teams 2–3 minutes to argue for their spend, then the facilitator enters the room's decisions and reads the consequences aloud.</p>
      </div>
    </div>
    <button data-action="home">Back</button>
  </section>`;
}

function stepper() {
  const activeIndex = STEPS.indexOf(game.currentStep);
  return `<nav class="stepper" aria-label="Season steps">${STEPS.map((step, index) => `<button data-action="step" data-step="${step}" class="${index === activeIndex ? "active" : index < activeIndex ? "done" : ""}"><i>${index < activeIndex ? "✓" : index + 1}</i><span>${labelize(step)}</span></button>`).join("")}</nav>`;
}

function nextStepLabel() {
  const index = STEPS.indexOf(game.currentStep);
  return index < STEPS.length - 1 ? `Continue to ${labelize(STEPS[index + 1])}` : "Advance Season";
}

function nextButton(disabled = false, label = "") {
  return `<button class="advance" data-action="next" ${disabled ? "disabled" : ""}>${label || nextStepLabel()}</button>`;
}

function dashboard() {
  const s = season();
  return `<section class="dashboard">
    ${metric("Season", s.name)}
    ${metric("Budget", `$${s.budget}M`)}
    ${metric("Spend", `$${s.spend}M`, s.spend > s.budget ? "bad" : "")}
    ${metric("Unspent", `$${s.unspentBudget}M`, s.unspentBudget < 0 ? "bad" : "")}
    ${metric("Market", s.marketPrice ? `$${s.marketPrice}/MWh` : "-")}
    ${metric("Demand", s.demandMw ? formatMw(s.demandMw) : "-")}
    ${metric("Available", s.availableMw ? formatMw(s.availableMw) : "-")}
    ${metric("Profit", `$${game.totalProfit}M`, game.totalProfit < 0 ? "bad" : "good")}
    ${metric("Reliability", `${s.reliabilityScore}/5`, s.reliabilityScore <= 2 ? "bad" : s.reliabilityScore >= 4 ? "good" : "")}
    ${metric("Customers", `${s.customerImpactScore}/5`, s.customerImpactScore <= 2 ? "bad" : s.customerImpactScore >= 4 ? "good" : "")}
    ${metric("Trend", `${game.marketTrend > 0 ? "+" : ""}${game.marketTrend}`)}
    ${metric("Capital", `$${game.totalCapitalInvested}M`)}
    ${metric("Fuel Cost", `$${s.fuelCostExpense || 0}M`, s.fuelCostExpense > 120 ? "bad" : "")}
    ${metric(seasonConfig(s.name).preparedBy ? "Prep Score" : "Prep Target", seasonConfig(s.name).preparedBy ? `${s.peakReadinessScore}/16` : seasonConfig(s.name).prepares || "-")}
  </section>`;
}

function stepContent() {
  if (game.currentStep === "rolls") return rollsScreen();
  if (game.currentStep === "budget") return budgetScreen();
  if (game.currentStep === "fuel") return fuelScreen();
  if (game.currentStep === "ops") return opsScreen();
  if (game.currentStep === "capital") return capitalScreen();
  if (game.currentStep === "event") return eventScreen();
  if (game.currentStep === "outages") return outageScreen();
  return resultsScreen();
}

function rollsScreen() {
  const s = season();
  return `<section class="panel"><h2>Market, Demand, Fuel, and Hydro Rolls</h2>${seasonBanner()}
    <div class="roll-grid">${["demand", "coal", "gas", "hydro"].map((key) => dice(key)).join("")}</div>
    <div class="roll-table"><h3>Demand / Market Price Table</h3>${DATA.demand.map((row) => {
      const market = DATA.market.find((item) => item.roll === row.roll);
      return `<div><span>${row.roll}</span><strong>${row.label}</strong><em>${formatMw(row.demandMw)} | $${market.price}/MWh base</em></div>`;
    }).join("")}</div>
    ${s.marketPrice ? fuelEconomicsPanel() : ""}
    <div class="button-row"><button data-action="manual-rolls">Apply Manual Rolls</button><button class="secondary" data-action="auto-rolls">Auto Roll from Seed</button>${nextButton(!s.marketPrice, !s.marketPrice ? "Roll conditions first" : "")}</div>
  </section>`;
}

function dice(key) {
  const label = key === "demand" ? "Demand / Market" : labelize(key);
  return `<div class="dice"><span>${label}</span><strong>${rollInputs[key]}</strong><select class="roll-input" data-roll="${key}">${[1,2,3,4,5,6].map((n) => `<option ${rollInputs[key] === n ? "selected" : ""}>${n}</option>`).join("")}</select><button class="secondary" data-action="roll-one" data-roll="${key}">Roll d6</button></div>`;
}

function seasonBanner() {
  const s = season();
  const config = seasonConfig(s.name);
  if (config.prepares) {
    const prep = prepScoreFromSeason(s);
    return `<div class="season-banner prep"><strong>${s.name} prepares ${config.prepares}</strong><span>Current readiness if peak started now: ${prep.score}/16. Maintenance, fuel protection, and capital work here will affect ${config.prepares} revenue and risk.</span></div>`;
  }
  return `<div class="season-banner peak"><strong>${s.name} peak season</strong><span>${config.preparedBy} readiness: ${s.peakReadinessScore}/16. Demand includes +${formatMw(s.seasonalStressDemandBonus || config.stressDemandBonus)} seasonal stress and market margin is multiplied ${config.peakMarginMultiplier}x.</span></div>`;
}

function budgetScreen() {
  const s = season();
  const overspent = s.spend > s.budget && !game.settings.allowDeficitSpending;
  return `<section class="panel"><h2>Budget Allocation</h2>${seasonBanner()}<div class="asset-grid">${DATA.assets.map((asset) => assetCard(asset)).join("")}</div>${budgetFooter()}${nextButton(overspent, overspent ? "Spending exceeds budget" : "")}</section>`;
}

function assetCard(asset) {
  const s = season();
  return `<article class="asset-card" style="border-top-color:${COLORS[asset.id]}"><div class="asset-head"><h3>${asset.name}</h3><span>${asset.capacityMw ? formatMw(asset.capacityMw) : asset.role}</span></div><p>Condition ${asset.condition}/10 | EFOR ${asset.eforRisk} | Derate ${asset.derateRisk}</p><div class="option-list">${DATA.budgetOptions[asset.id].map((o) => choice(o, s.selectedBudgetOptions[asset.id] === o.id, "budget", { asset: asset.id, option: o.id })).join("")}</div></article>`;
}

function fuelScreen() {
  const s = season();
  return `<section class="panel"><h2>Fuel Contracting and Hedging</h2><div class="two-col">${["coal", "gas"].map((fuel) => `<div class="strategy-panel"><h3>${labelize(fuel)} Strategy</h3><p>Rolled cost: $${fuel === "coal" ? s.coalFuelCost || "-" : s.gasFuelCost || "-"}/MWh</p>${DATA.fuelStrategies[fuel].map((o) => choice(o, s.selectedFuelStrategies[fuel] === o.id, "fuel", { fuel, option: o.id })).join("")}</div>`).join("")}</div>${fuelEconomicsPanel()}${budgetFooter()}${nextButton()}</section>`;
}

function opsScreen() {
  const s = season();
  return `<section class="panel"><h2>Operating Strategy</h2><div class="asset-grid compact">${DATA.assets.map((asset) => `<div class="strategy-selector" style="border-left-color:${COLORS[asset.id]}"><h3>${asset.name}</h3><div class="segmented">${DATA.operatingStrategies.map((o) => `<button data-action="ops" data-asset="${asset.id}" data-option="${o.id}" class="${s.selectedOperatingStrategies[asset.id] === o.id ? "active" : ""}">${o.name}</button>`).join("")}</div></div>`).join("")}</div>${capacityBar()}${nextButton()}</section>`;
}

function capitalScreen() {
  return `<section class="panel"><h2>Capital Investment</h2>${seasonBanner()}<p class="muted">Management may approve one capital project per season. For every $100M approved, future annual profit adds +$8M.</p><div class="project-grid">${DATA.capitalProjects.map((p) => choice(p, season().selectedCapitalProject === p.id, "capital", { project: p.id })).join("")}</div>${budgetFooter()}${nextButton()}</section>`;
}

function eventScreen() {
  const s = season();
  const appliedName = DATA.events.find((e) => e.id === s.eventDrawn)?.name || "";
  return `<section class="panel"><h2>Event Card</h2><div class="event-grid">${DATA.events.map((e) => `<button class="event-card ${selectedEventId === e.id || s.eventDrawn === e.id ? "selected" : ""}" data-action="select-event" data-event="${e.id}" ${s.eventApplied ? "disabled" : ""}><strong>${e.name}</strong><span>${e.effect}</span></button>`).join("")}</div>${s.eventApplied ? `<p class="status-note">Applied: ${appliedName}</p>` : ""}<div class="button-row"><button data-action="apply-event" ${s.eventApplied ? "disabled" : ""}>Apply Selected Event</button><button class="secondary" data-action="random-event" ${s.eventApplied ? "disabled" : ""}>Draw Random</button>${nextButton(!s.eventApplied, !s.eventApplied ? "Apply an event first" : "")}</div></section>`;
}

function outageScreen() {
  const s = season();
  const has = Object.keys(s.outageResults).length > 0;
  return `<section class="panel"><h2>Outage and Derate Resolution</h2><button data-action="outages">Auto-Resolve All</button>${has ? `<div class="result-grid">${Object.entries(s.outageResults).map(([id, r]) => resultLine(assetById(id).name, r)).join("")}</div><h3>Derates</h3><div class="result-grid">${Object.entries(s.derateResults).map(([id, r]) => resultLine(assetById(id).name, r)).join("")}</div>` : ""}${nextButton(!has, !has ? "Resolve outages first" : "")}</section>`;
}

function resultsScreen() {
  const s = season();
  const config = seasonConfig(s.name);
  const lesson = config.prepares
    ? `${s.name} was a preparation round. Its team choices will become ${config.prepares} readiness.`
    : `${s.name} monetized prior prep: readiness revenue $${s.peakReadinessRevenue}M, missed-prep penalty $${s.peakReadinessPenalty}M.`;
  return `<section class="panel"><h2>${s.name} Results</h2><div class="two-col">${profitBridge()}<div class="summary"><h3>Debrief</h3><p><strong>Reliability:</strong> ${s.reliabilityScore}/5</p><p><strong>Customer impact:</strong> ${s.customerImpactScore}/5</p><p><strong>Lesson:</strong> ${lesson}</p><ul>${s.notes.slice(-8).map((n) => `<li>${escapeHtml(n)}</li>`).join("")}</ul></div></div><button class="advance" data-action="${game.currentSeasonIndex === DATA.seasons.length - 1 ? "year-end" : "next"}">${game.currentSeasonIndex === DATA.seasons.length - 1 ? "Year-End Summary" : `Advance to ${DATA.seasons[game.currentSeasonIndex + 1].name}`}</button></section>`;
}

function yearEndScreen() {
  const best = [...game.seasons].sort((a, b) => b.profit - a.profit)[0];
  const worst = [...game.seasons].sort((a, b) => a.profit - b.profit)[0];
  const avgRel = avg(game.seasons.map((s) => s.reliabilityScore));
  const avgCust = avg(game.seasons.map((s) => s.customerImpactScore));
  const peakRevenue = game.seasons.reduce((sum, item) => sum + (item.peakReadinessRevenue || 0), 0);
  const missedPrep = game.seasons.reduce((sum, item) => sum + (item.peakReadinessPenalty || 0), 0);
  return `<section class="panel"><h2>Year-End Summary</h2><div class="scoreboard">${metric("Annual Profit", `$${game.totalProfit}M`)}${metric("Peak Prep Revenue", `$${peakRevenue}M`)}${metric("Missed Prep", `$${missedPrep}M`, missedPrep ? "bad" : "good")}${metric("Avg Reliability", `${avgRel.toFixed(1)}/5`)}${metric("Avg Customers", `${avgCust.toFixed(1)}/5`)}${metric("Regulatory Trust", `${game.regulatoryTrust}/5`)}</div><div class="two-col"><div class="summary"><h3>Operating Review</h3><p>Best season: ${best.name} ($${best.profit}M)</p><p>Worst season: ${worst.name} ($${worst.profit}M)</p><p>Biggest risk taken: ${biggestRisk()}</p><p>Highest value investment: ${activeInvestments()[0] ? labelize(activeInvestments()[0]) : "None"}</p></div><div class="summary"><h3>Final Rating</h3><div class="rating">${finalRating()}</div><p class="epitaph">${epitaph()}</p><p>Spring prepares Summer. Fall prepares Winter. Profit discipline works when it creates peak-season readiness instead of hidden reliability debt.</p></div></div><div class="summary crew-report"><h3>Crew Debrief</h3><ul>${crewReport()}</ul></div><button data-action="home">Return Home</button></section>`;
}

function notesPanel() {
  return `<aside class="notes"><h3>Facilitator Notes</h3><p>Ask teams which saved dollar produced profit and which saved dollar created risk.</p><ul>${season().notes.slice(-4).map((n) => `<li>${escapeHtml(n)}</li>`).join("")}</ul></aside>`;
}

function operationsBoard() {
  const s = season();
  const activeIndex = STEPS.indexOf(game.currentStep);
  return `
    <section class="ops-board">
      <div class="ops-board-head">
        <div><h2>Season Operations Board</h2><p>${seasonFrameText(s)}</p></div>
        <strong>${formatMw(s.availableMw || 0)} / ${formatMw(s.demandMw || 0)}</strong>
      </div>
      <div class="flow-track">${STEPS.map((step, index) => `<div class="flow-node ${index < activeIndex ? "done" : ""} ${index === activeIndex ? "current" : ""}"><span>${index + 1}</span><strong>${labelize(step)}</strong></div>`).join("")}</div>
      <div class="season-chain">${DATA.seasons.map((item, index) => `<div class="${index === game.currentSeasonIndex ? "active" : ""} ${item.prepares ? "prep" : "peak"}"><strong>${item.name}</strong><span>${item.role}</span></div>`).join("")}</div>
      <div class="team-strip">${DATA.assets.map((asset) => teamToken(asset)).join("")}</div>
    </section>`;
}

function teamToken(asset) {
  const s = season();
  const budget = budgetOption(asset.id, s.selectedBudgetOptions[asset.id]);
  const ops = opsOption(s.selectedOperatingStrategies[asset.id]);
  const lost = Math.abs((s.eventCapacityAdjustments[asset.id] || 0) + (s.outageCapacityAdjustments[asset.id] || 0));
  const risk = budget.efor;
  const lead = CREW.find((member) => member.asset === asset.id);
  const status = crewStatus(asset.id);
  return `
    <div class="team-token" style="border-left-color:${COLORS[asset.id]}">
      <div><strong>${asset.name}</strong><span>${budget.name}</span></div>
      <em>${ops.name} | ${risk} EFOR${lost ? ` | -${lost} MW` : ""}</em>
      <div class="crew-line"><i class="crew-dot ${status}"></i><span>${lead.name}</span><em>${status === "ready" ? "On shift" : status === "strained" ? "Strained" : "Having a day"}</em></div>
    </div>`;
}

function crewStatus(assetId) {
  const s = season();
  const outage = s.outageResults?.[assetId];
  const derate = s.derateResults?.[assetId];
  const hadOutage = outage?.label === "Forced outage";
  const hadDerate = derate && derate.label !== "No Derate";
  if (hadOutage && hadDerate) return "down";
  if (hadOutage || derate?.label === "Major Derate") return "strained";
  return "ready";
}

function stagePanel() {
  const consequences = currentConsequences();
  const s = season();
  return `
    <section class="stage-panel">
      <div class="stage-column">
        <h3>Next-Stage Consequences</h3>
        <ul>${consequences.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
      <div class="stage-column">
        <h3>${seasonStageTitle(s)}</h3>
        <ul>${seasonReadinessLines(s).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
      <div class="stage-column">
        <h3>Decision Feed</h3>
        <ul>${(s.stageLog.length ? s.stageLog.slice(-5) : ["No team decisions recorded yet."]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
    </section>`;
}

function seasonFrameText(s) {
  const config = seasonConfig(s.name);
  if (config.prepares) return `${s.name}: prepare the fleet, fuel book, and grid for ${config.prepares}. Choices here become readiness in the next peak season.`;
  return `${s.name}: peak demand season. ${config.preparedBy} readiness turns into revenue if capacity holds, or penalties if it does not.`;
}

function seasonStageTitle(s) {
  const config = seasonConfig(s.name);
  return config.prepares ? `${config.prepares} Readiness Preview` : `${s.name} Peak Economics`;
}

function seasonReadinessLines(s) {
  const config = seasonConfig(s.name);
  if (config.prepares) {
    const score = prepScoreFromSeason(s);
    const target = config.prepares;
    return [
      `Current ${target} readiness: ${score.score}/16.`,
      `Strong prep earns peak revenue next season; weak prep creates missed-opportunity penalties.`,
      ...score.lines.slice(0, 4),
    ];
  }
  const source = previousPrepSeason();
  return [
    `${config.preparedBy} readiness entering ${s.name}: ${s.peakReadinessScore}/16.`,
    `Stress demand added this season: ${formatMw(s.seasonalStressDemandBonus || config.stressDemandBonus)}.`,
    `Peak market margin multiplier: ${config.peakMarginMultiplier}x.`,
    source ? `Prepared by: ${source.name} decisions.` : "No prior prep season found.",
  ];
}

function currentConsequences() {
  const s = season();
  const config = seasonConfig(s.name);
  if (game.currentStep === "rolls") {
    return [
      s.marketPrice ? `Market price is $${s.marketPrice}/MWh; the demand/market roll sets the base price, then fuel pressure can move it: ${(s.priceFormation || []).join("; ")}.` : "Roll demand/market, coal, gas, and hydro before budget choices.",
      s.demandMw ? `Demand target is ${formatMw(s.demandMw)}${s.seasonalStressDemandBonus ? ` including ${formatMw(s.seasonalStressDemandBonus)} seasonal stress` : ""}; available fleet models at ${formatMw(s.availableMw)}.` : "Demand has not been set yet.",
      s.fuelCostExpense ? `Fuel dispatch currently burns $${s.fuelCostExpense}M: hydro serves ${formatMw(effectiveAssetCapacity("hydro"))} at $0 fuel cost, coal ${formatMw(s.fuelDispatch.coalMw)} at $${s.fuelDispatch.coalCost}/MWh, gas ${formatMw(s.fuelDispatch.gasMw)} at $${s.fuelDispatch.gasCost}/MWh.` : "Hydro has no fuel cost; coal and gas become the largest variable cost once demand is served.",
    ];
  }
  if (game.currentStep === "budget") {
    const lines = DATA.assets.map((asset) => {
      const option = budgetOption(asset.id, s.selectedBudgetOptions[asset.id]);
      return `${asset.name}: ${option.name} costs $${option.cost}M and sets ${option.efor} EFOR for the outage stage.`;
    });
    if (config.prepares) lines.unshift(`This is a prep season: these choices become ${config.prepares} readiness.`);
    return lines;
  }
  if (game.currentStep === "fuel") {
    return [
      fuelConsequence("coal", "Coal Supply Disruption"),
      fuelConsequence("gas", "Gas Pipeline Constraint / Polar Vortex"),
      `Effective dispatch cost: coal $${effectiveFuelCost("coal", s.coalFuelCost || 30, s.selectedFuelStrategies.coal)}/MWh, gas $${effectiveFuelCost("gas", s.gasFuelCost || 45, s.selectedFuelStrategies.gas)}/MWh.`,
      `Projected fuel burn is $${s.fuelCostExpense}M, usually larger than maintenance or capital choices in the season result.`,
    ];
  }
  if (game.currentStep === "ops") {
    return DATA.assets.map((asset) => {
      const ops = opsOption(s.selectedOperatingStrategies[asset.id]);
      return `${asset.name}: ${ops.name} moves capacity to ${Math.round(ops.capacityMultiplier * 100)}% and changes outage threshold by ${ops.outageRollModifier}.`;
    });
  }
  if (game.currentStep === "capital") {
    const project = capitalProject(s.selectedCapitalProject);
    return [`Selected capital: ${project.name} ($${project.cost}M).`, project.effect, `Cumulative capital is $${game.totalCapitalInvested}M; rate-base teaching credit is +$${Math.floor(game.totalCapitalInvested / 100) * 8}M profit.`];
  }
  if (game.currentStep === "event") {
    const event = DATA.events.find((item) => item.id === (s.eventDrawn || selectedEventId));
    return [s.eventApplied ? `Applied event: ${event.name}.` : `Selected event: ${event.name}.`, event.effect, "Prepared teams convert prior decisions into avoided penalties, extra margin, or lower customer pain."];
  }
  if (game.currentStep === "outages") {
    return Object.keys(s.outageResults).length
      ? [`Forced outage checks complete: penalties $${s.outagePenalties}M.`, `Capacity after event/outage impacts is ${formatMw(s.availableMw)} against ${formatMw(s.demandMw || 0)} demand.`, `Reliability is now ${s.reliabilityScore}/5.`]
      : ["Run outage and derate checks. Budget discipline, EFOR, and operating posture now turn into real capacity risk."];
  }
  return [`Net seasonal profit is $${s.profit}M.`, `Reliability: ${s.reliabilityScore}/5. Customer impact: ${s.customerImpactScore}/5.`, "Use the decision feed to debrief which team choices created value or risk."];
}

function fuelConsequence(fuel, eventName) {
  const s = season();
  const strategy = DATA.fuelStrategies[fuel].find((o) => o.id === s.selectedFuelStrategies[fuel]);
  const protectedText = (fuel === "coal" && strategy.id === "inventory") || (fuel === "gas" && strategy.id === "transport") ? "protected" : "exposed";
  return `${labelize(fuel)}: ${strategy.name} leaves the team ${protectedText} for ${eventName}.`;
}

function saveControls() {
  if (screen === "home") return "";
  return `<div class="save-controls"><button class="secondary" data-action="save">Save</button><button class="ghost" data-action="home">Home</button><button class="danger" data-action="reset">Reset</button></div>`;
}

function renderCutscene() {
  if (!game.pendingCutscene) return "";
  const scene = game.pendingCutscene;
  return `
    <section class="cutscene-overlay" role="dialog" aria-modal="true" aria-labelledby="cutscene-title">
      <div class="cutscene-card">
        <div class="cutscene-bg" style="background-image: url('${scene.image}')"></div>
        <div class="cutscene-shade"></div>
        <div class="cutscene-copy">
          <p class="eyebrow">${escapeHtml(scene.kicker || "Operations Moment")}</p>
          <h2 id="cutscene-title">${escapeHtml(scene.title)}</h2>
          <p>${escapeHtml(scene.narration)}</p>
          <div class="cutscene-stats">${scene.stats.map((stat) => `<span><em>${escapeHtml(stat.label)}</em><strong>${escapeHtml(stat.value)}</strong></span>`).join("")}</div>
          <button data-action="dismiss-cutscene">Continue</button>
        </div>
      </div>
    </section>`;
}

function dismissCutscene() {
  game.pendingCutscene = null;
  saveGame();
}

function assignDilemma(s) {
  if (game.settings.fieldDispatches === false) return;
  if (s.dilemmaId) return;
  const used = game.seasons.map((item) => item.dilemmaId).filter(Boolean);
  const pool = DILEMMAS.filter((d) => !used.includes(d.id));
  if (!pool.length) return;
  const pick = (rollD6(`${game.seed}-${s.name}-dilemma-a`) * 7 + rollD6(`${game.seed}-${s.name}-dilemma-b`)) % pool.length;
  s.dilemmaId = pool[pick].id;
}

function chooseDilemma(index) {
  const s = season();
  const dilemma = DILEMMAS.find((d) => d.id === s.dilemmaId);
  if (!dilemma || s.dilemmaChoice != null) return;
  const choice = dilemma.choices[index];
  if (!choice) return;
  let outcome = choice;
  if (choice.risk) {
    const roll = rollD6(`${game.seed}-${s.name}-dilemma-risk`);
    outcome = roll > choice.risk.threshold ? choice.risk.success : choice.risk.failure;
  }
  s.dilemmaChoice = index;
  s.dilemmaProfitDelta = outcome.profit || 0;
  s.dilemmaReliabilityDelta = outcome.reliability || 0;
  s.dilemmaCustomerDelta = outcome.customers || 0;
  s.dilemmaOutcome = outcome.log;
  s.notes.push(`Field dispatch — ${dilemma.title}: ${outcome.log}`);
  addStageLog(`Field dispatch — ${dilemma.title}: ${outcome.log}`);
  recalculate(game);
  saveGame();
}

function acknowledgeDilemma() {
  const s = season();
  s.dilemmaAcked = true;
  saveGame();
}

function renderDilemma() {
  if (screen !== "play" || game.pendingCutscene) return "";
  const s = season();
  if (!s.dilemmaId || s.dilemmaAcked) return "";
  const dilemma = DILEMMAS.find((d) => d.id === s.dilemmaId);
  if (!dilemma) return "";
  if (s.dilemmaChoice != null) {
    const deltas = [
      s.dilemmaProfitDelta ? `Profit ${s.dilemmaProfitDelta > 0 ? "+" : ""}$${s.dilemmaProfitDelta}M` : "",
      s.dilemmaReliabilityDelta ? `Reliability ${s.dilemmaReliabilityDelta > 0 ? "+" : ""}${s.dilemmaReliabilityDelta}` : "",
      s.dilemmaCustomerDelta ? `Customers ${s.dilemmaCustomerDelta > 0 ? "+" : ""}${s.dilemmaCustomerDelta}` : "",
    ].filter(Boolean);
    return `
      <section class="dilemma-overlay" role="dialog" aria-modal="true" aria-labelledby="dilemma-title">
        <div class="dilemma-card">
          <p class="dilemma-kicker">Field Dispatch — ${escapeHtml(s.name)}</p>
          <h2 id="dilemma-title">${escapeHtml(dilemma.title)}</h2>
          <p class="dilemma-outcome">${escapeHtml(s.dilemmaOutcome || "")}</p>
          ${deltas.length ? `<div class="dilemma-deltas">${deltas.map((d) => `<span>${escapeHtml(d)}</span>`).join("")}</div>` : `<div class="dilemma-deltas"><span>No lasting impact</span></div>`}
          <button data-action="dilemma-ack">Back to Operations</button>
        </div>
      </section>`;
  }
  return `
    <section class="dilemma-overlay" role="dialog" aria-modal="true" aria-labelledby="dilemma-title">
      <div class="dilemma-card">
        <p class="dilemma-kicker">Field Dispatch — ${escapeHtml(s.name)}</p>
        <h2 id="dilemma-title">${escapeHtml(dilemma.title)}</h2>
        <p>${escapeHtml(dilemma.text)}</p>
        <div class="dilemma-choices">
          ${dilemma.choices.map((choice, index) => `<button data-action="dilemma-choice" data-index="${index}"><strong>${escapeHtml(choice.label)}</strong><span>${escapeHtml(choice.detail)}</span></button>`).join("")}
        </div>
      </div>
    </section>`;
}

function resolveRolls(manual) {
  const s = season();
  const seed = `${game.seed}-${s.name}`;
  const rolls = {
    demand: manual?.demand || rollD6(`${seed}-demand`),
    coal: manual?.coal || rollD6(`${seed}-coal`),
    gas: manual?.gas || rollD6(`${seed}-gas`),
    hydro: manual?.hydro || rollD6(`${seed}-hydro`),
  };
  s.rolls = rolls;
  const demand = DATA.demand.find((r) => r.roll === rolls.demand);
  const hydro = DATA.hydro.find((r) => r.rolls.includes(rolls.hydro));
  const config = seasonConfig(s.name);
  const prep = config.preparedBy ? prepScoreFromSeason(previousPrepSeason()) : { score: 0, lines: [] };
  s.seasonalStressDemandBonus = config.stressDemandBonus || 0;
  s.peakReadinessScore = prep.score;
  s.demandMw = demand.demandMw + game.permanentDemandChangeMw + s.seasonalStressDemandBonus;
  s.coalFuelCost = DATA.coalFuel[rolls.coal - 1];
  s.gasFuelCost = DATA.gasFuel[rolls.gas - 1];
  const market = resolveMarketFromFundamentals(rolls.demand, s.demandMw, s.coalFuelCost, s.gasFuelCost, game.settings.marketTrend ? game.marketTrend : 0);
  s.marketPrice = market.price;
  s.priceFormation = market.reasons;
  s.hydroAvailableMw = hydro.availableMw;
  resetSeasonResolution(s);
  s.seasonalStressDemandBonus = config.stressDemandBonus || 0;
  s.peakReadinessScore = prep.score;
  s.priceFormation = market.reasons;
  s.notes = [`Market: ${market.label} at $${market.price}/MWh`, `Price formed from: ${market.reasons.join("; ")}`, `Demand: ${demand.label} at ${formatMw(s.demandMw)}${s.seasonalStressDemandBonus ? ` including ${formatMw(s.seasonalStressDemandBonus)} ${s.name} stress` : ""}`, `Hydro: ${hydro.label} at ${hydro.availableMw} MW`];
  assignDilemma(s);
  recalculate(game);
}

function resetSeasonResolution(s) {
  game.permanentDemandChangeMw -= s.permanentDemandDelta || 0;
  game.marketTrend -= s.marketTrendDelta || 0;
  s.permanentDemandDelta = 0;
  s.marketTrendDelta = 0;
  s.eventDrawn = "";
  s.eventApplied = false;
  s.outageResults = {};
  s.derateResults = {};
  s.eventCapacityAdjustments = {};
  s.outageCapacityAdjustments = {};
  s.eventMarketMargin = 0;
  s.operatingBonus = 0;
  s.eventPenalties = 0;
  s.outagePenalties = 0;
  s.eventReliabilityDelta = 0;
  s.outageReliabilityDelta = 0;
  s.eventCustomerDelta = 0;
  s.outageCustomerDelta = 0;
  s.subsidyPayments = 15;
}

function selectBudget(asset, option) {
  const s = season();
  s.selectedBudgetOptions[asset] = option;
  const selected = budgetOption(asset, option);
  addStageLog(`${assetById(asset).name} team chose ${selected.name}. Next outage stage uses ${selected.efor} EFOR; ${selected.effect}.`);
  recalculate(game);
  saveGame();
}
function selectFuel(fuel, option) {
  const s = season();
  s.selectedFuelStrategies[fuel] = option;
  const selected = DATA.fuelStrategies[fuel].find((o) => o.id === option);
  addStageLog(`${labelize(fuel)} fuel team chose ${selected.name}. Next event stage: ${selected.effect}.`);
  recalculate(game);
  saveGame();
}
function selectOps(asset, option) {
  const s = season();
  s.selectedOperatingStrategies[asset] = option;
  const selected = opsOption(option);
  addStageLog(`${assetById(asset).name} operations set ${selected.name}. Next capacity stage: ${selected.effect}.`);
  recalculate(game);
  saveGame();
}
function selectCapital(project) {
  const s = season();
  s.selectedCapitalProject = project;
  const selected = capitalProject(project);
  addStageLog(`Management selected ${selected.name}. Next event/outage stages: ${selected.effect}`);
  recalculate(game);
  saveGame();
}

function applyEvent(id) {
  const s = season();
  if (s.eventApplied) return;
  s.eventDrawn = id;
  s.eventApplied = true;
  s.eventCapacityAdjustments = {};
  s.eventMarketMargin = 0;
  s.eventPenalties = 0;
  s.eventReliabilityDelta = 0;
  s.eventCustomerDelta = 0;
  const investments = activeInvestments();
  const has = (asset, option) => s.selectedBudgetOptions[asset] === option || investments.includes(option);
  const addCapacity = (asset, mw) => { s.eventCapacityAdjustments[asset] = (s.eventCapacityAdjustments[asset] || 0) + mw; };
  const addTrend = (value) => { game.marketTrend += value; s.marketTrendDelta += value; };
  const addPermanentDemand = (value) => { game.permanentDemandChangeMw += value; s.permanentDemandDelta += value; };
  if (id === "heatDome") { s.demandMw = (s.demandMw || 6500) + 500; addTrend(1); if (!has("td", "hardening") && !investments.includes("gridHardening")) s.eventCustomerDelta -= 1; }
  if (id === "polarVortex") { s.demandMw = (s.demandMw || 6500) + 500; addTrend(1); if (s.selectedFuelStrategies.gas !== "transport" && !investments.includes("gasTransport")) s.eventPenalties += 30; }
  if (id === "dataCenterGrowth") { addPermanentDemand(500); addTrend(1); if (has("td", "datacenter") || investments.includes("dataCenterInterconnect")) s.eventMarketMargin += 20; }
  if (id === "gasPipelineConstraint") { addTrend(1); if (s.selectedFuelStrategies.gas !== "transport" && !investments.includes("gasTransport")) { addCapacity("gas", -700); s.eventPenalties += 30; } }
  if (id === "coalSupplyDisruption") { addTrend(1); if (s.selectedFuelStrategies.coal !== "inventory") { addCapacity("coal", -500); s.eventPenalties += 20; s.eventCustomerDelta -= 1; } }
  if (id === "derecho" && !["standard", "hardening"].includes(s.selectedBudgetOptions.td) && !investments.includes("gridHardening")) { s.eventReliabilityDelta -= 2; s.eventPenalties += 40; }
  if (id === "mildWeather") { s.demandMw = Math.max(0, (s.demandMw || 6500) - 500); addTrend(-1); s.eventCustomerDelta += 1; }
  if (id === "efficiency") { addPermanentDemand(-200); addTrend(-1); s.eventCustomerDelta += 1; }
  if (id === "environment" && s.selectedBudgetOptions.coal !== "environmental") { addCapacity("coal", -300); s.eventPenalties += 40; }
  if (id === "forecastMiss" && s.selectedBudgetOptions.renewables !== "forecasting" && !investments.includes("forecastingTools")) { s.eventReliabilityDelta -= 1; s.eventCustomerDelta -= 1; }
  if (id === "strongRenewables") { s.subsidyPayments = 25; s.eventCustomerDelta += 1; }
  if (id === "curtailment") s.subsidyPayments = has("renewables", "storage") || investments.includes("renewableStorage") ? 15 : 5;
  const event = DATA.events.find((e) => e.id === id);
  s.notes.push(`Event: ${event.name}. ${event.effect}`);
  addStageLog(`Event applied: ${event.name}. Next outage stage will test mitigations and capacity impacts.`);
  recalculate(game);
  maybeTriggerCutscene("event");
  saveGame();
}

function resolveOutages() {
  const s = season();
  if (s.outageResults.nuclear?.occurred) game.regulatoryTrust += 2;
  s.outageResults = {};
  s.derateResults = {};
  s.outageCapacityAdjustments = {};
  s.outagePenalties = 0;
  s.outageReliabilityDelta = 0;
  s.outageCustomerDelta = 0;
  for (const asset of DATA.assets) {
    const option = budgetOption(asset.id, s.selectedBudgetOptions[asset.id]);
    const strategy = opsOption(s.selectedOperatingStrategies[asset.id]);
    const roll = rollD6(`${game.seed}-${s.name}-${asset.id}-outage`);
    const threshold = clamp(riskThreshold(option.efor) + strategy.outageRollModifier, 0, 6);
    const outage = roll <= threshold;
    const impact = outageImpact(asset.id);
    s.outageResults[asset.id] = { roll, label: outage ? "Forced outage" : "No outage", capacityImpactMw: outage ? impact.mw : 0, profitImpact: outage ? impact.penalty : 0, notes: [outage ? impact.note : `${asset.name} held through the season.`] };
    if (outage) {
      addOutageCapacity(asset.id, -impact.mw);
      s.outagePenalties += impact.penalty;
      s.outageReliabilityDelta -= impact.reliability;
      if (asset.id === "td") s.outageCustomerDelta -= 2;
      if (asset.id === "nuclear") game.regulatoryTrust -= 2;
      addStageLog(OUTAGE_QUOTES[asset.id]);
    }
    if (["defer", "min"].includes(option.id) || asset.condition <= 6) {
      const derateRoll = rollD6(`${game.seed}-${s.name}-${asset.id}-derate`);
      const result = derateRoll >= 6 ? "Major Derate" : derateRoll >= 4 ? "Small Derate" : "No Derate";
      const derate = derateImpact(asset.id, result);
      s.derateResults[asset.id] = { roll: derateRoll, label: result, capacityImpactMw: derate.mw, profitImpact: derate.penalty, notes: [derate.note] };
      addOutageCapacity(asset.id, -derate.mw);
      s.outagePenalties += derate.penalty;
      if (derate.mw > 0) s.outageReliabilityDelta -= result === "Major Derate" ? 2 : 1;
    }
  }
  recalculate(game);
  addStageLog(`Outage stage resolved. Capacity ${formatMw(s.availableMw)}, penalties $${s.penalties}M, reliability ${s.reliabilityScore}/5.`);
  maybeTriggerCutscene("outages");
  saveGame();
}

function addOutageCapacity(asset, mw) {
  const s = season();
  s.outageCapacityAdjustments[asset] = (s.outageCapacityAdjustments[asset] || 0) + mw;
}

function addStageLog(message) {
  const s = season();
  s.stageLog ||= [];
  if (s.stageLog[s.stageLog.length - 1] !== message) s.stageLog.push(message);
  if (s.stageLog.length > 40) s.stageLog = s.stageLog.slice(-40);
}

function resolveMarketFromFundamentals(baseRoll, demandMw, coalCost, gasCost, trend) {
  let adjustment = trend;
  const reasons = [`demand/market roll ${baseRoll}`];
  if (trend) reasons.push(`market trend ${trend > 0 ? "+" : ""}${trend}`);
  if (demandMw >= 8800) { adjustment += 3; reasons.push("extreme demand +3"); }
  else if (demandMw >= 8000) { adjustment += 2; reasons.push("very high demand +2"); }
  else if (demandMw >= 7200) { adjustment += 1; reasons.push("high demand +1"); }
  else if (demandMw <= 6000) { adjustment -= 1; reasons.push("soft demand -1"); }
  if (gasCost >= 120) { adjustment += 2; reasons.push("gas price spike +2"); }
  else if (gasCost >= 80) { adjustment += 1; reasons.push("high gas cost +1"); }
  if (coalCost >= 45) { adjustment += 1; reasons.push("high coal cost +1"); }
  const finalRoll = clamp(baseRoll + adjustment, 1, 6);
  const market = DATA.market.find((row) => row.roll === finalRoll);
  return { ...market, finalRoll, reasons };
}

function effectiveFuelCost(fuel, rolledCost, strategyId) {
  if (fuel === "coal") {
    if (strategyId === "half") return Math.round((rolledCost + 32) / 2);
    if (strategyId === "full") return 35;
    return rolledCost;
  }
  if (strategyId === "half") return Math.round((rolledCost + 50) / 2);
  if (strategyId === "full") return 55;
  if (strategyId === "hedge") return Math.min(rolledCost, 70);
  return rolledCost;
}

function calculateFuelEconomics(g) {
  const s = season(g);
  const demand = s.demandMw || 6500;
  const nuclear = effectiveAssetCapacity("nuclear", g);
  const renewables = effectiveAssetCapacity("renewables", g);
  const hydro = effectiveAssetCapacity("hydro", g);
  const coalCapacity = effectiveAssetCapacity("coal", g);
  const gasCapacity = effectiveAssetCapacity("gas", g);
  let remaining = Math.max(0, demand - nuclear - renewables - hydro);
  const coalMw = Math.min(coalCapacity, remaining);
  remaining -= coalMw;
  const gasMw = Math.min(gasCapacity, remaining);
  const coalCost = effectiveFuelCost("coal", s.coalFuelCost || 30, s.selectedFuelStrategies.coal);
  const gasCost = effectiveFuelCost("gas", s.gasFuelCost || 45, s.selectedFuelStrategies.gas);
  const config = seasonConfig(s.name);
  const seasonalBurnMultiplier = config.preparedBy ? 1.2 : 1;
  const expense = Math.round(((coalMw / 1000) * coalCost + (gasMw / 1000) * gasCost) * 1.25 * seasonalBurnMultiplier);
  return { coalMw: Math.round(coalMw), gasMw: Math.round(gasMw), coalCost, gasCost, expense };
}

function addTransitionLog(fromStep) {
  const s = season();
  if (fromStep === "rolls" && s.marketPrice) addStageLog(`Roll stage locked: one demand/market roll set ${formatMw(s.demandMw || 0)} demand and a $${s.marketPrice}/MWh market after fuel pressure; projected fuel cost $${s.fuelCostExpense}M.`);
  if (fromStep === "budget") {
    const highRisk = DATA.assets.filter((asset) => ["defer", "min"].includes(s.selectedBudgetOptions[asset.id])).map((asset) => asset.name);
    addStageLog(highRisk.length ? `Budget stage locked: ${highRisk.join(", ")} will require derate checks if stress appears.` : "Budget stage locked: all teams avoided minimum/deferred work.");
  }
  if (fromStep === "fuel") {
    const coalProtected = s.selectedFuelStrategies.coal === "inventory";
    const gasProtected = s.selectedFuelStrategies.gas === "transport";
    addStageLog(`Fuel stage locked: coal supply ${coalProtected ? "protected" : "exposed"}, gas constraints ${gasProtected ? "protected" : "exposed"}.`);
  }
  if (fromStep === "ops") {
    const aggressive = DATA.assets.filter((asset) => s.selectedOperatingStrategies[asset.id] === "aggressive").map((asset) => asset.name);
    addStageLog(aggressive.length ? `Operating stage locked: ${aggressive.join(", ")} are pushing capacity and worsening outage odds.` : "Operating stage locked: no team selected aggressive operation.");
  }
  if (fromStep === "capital") {
    const project = capitalProject(s.selectedCapitalProject);
    addStageLog(`Capital stage locked: ${project.name} is now available as mitigation where applicable.`);
  }
  if (fromStep === "event" && s.eventApplied) addStageLog(`Event stage locked: ${DATA.events.find((event) => event.id === s.eventDrawn).name} effects now feed outage and scoring.`);
}

function maybeTriggerCutscene(context, options = {}) {
  if (game.pendingCutscene) return false;
  const s = season();
  s.cutscenesShown ||= {};
  const candidate = selectCutscene(context, options);
  if (!candidate) return false;
  const key = `${s.name}:${context}:${candidate.type}`;
  if (s.cutscenesShown[key]) return false;
  s.cutscenesShown[key] = true;
  game.pendingCutscene = buildCutscene(candidate.type, context, options);
  return true;
}

function selectCutscene(context, options = {}) {
  const s = season();
  const config = seasonConfig(s.name);
  const shortfall = capacityShortfall(s);
  const forcedOutage = Object.values(s.outageResults || {}).some((result) => result.label === "Forced outage" && result.capacityImpactMw >= 500);
  const tdOutage = s.outageResults?.td?.label === "Forced outage";
  const event = DATA.events.find((item) => item.id === s.eventDrawn);
  const isPeak = Boolean(config.preparedBy);
  if (context !== "seasonStart" && (s.reliabilityScore <= 2 || shortfall > 500 || forcedOutage || s.emergencyPurchases >= 75)) return { type: "reliabilityCrisis" };
  if (context !== "seasonStart" && (event?.id === "derecho" || tdOutage || s.customerImpactScore <= 2)) return { type: "stormResponse" };
  if (context !== "seasonStart" && isPeak && ((s.marketPrice || 0) >= 100) && (s.peakReadinessPenalty > 0 || s.availableMw < (s.demandMw || 0) * 1.1 || s.peakReadinessScore <= 7 || s.fuelCostExpense > Math.max(80, s.grossMarketRevenue * .55))) return { type: "missedOpportunity" };
  if (context !== "seasonStart" && isPeak && s.reliabilityScore >= 4 && s.customerImpactScore >= 4 && (s.profit > 0 || s.peakReadinessRevenue >= 40) && s.availableMw >= (s.demandMw || 0)) return { type: "peakWin" };
  if (context === "seasonStart" && options.prepScore <= 6) return { type: "prepFailure" };
  if (context === "seasonStart" && options.prepScore >= 11) return { type: "prepSuccess" };
  return null;
}

function buildCutscene(type, context, options = {}) {
  const s = season();
  const config = CUTSCENES[type];
  const payload = {
    type,
    image: config.image,
    title: config.title,
    narration: config.narration,
    kicker: cutsceneKicker(type, context),
    stats: cutsceneStats(type, options),
  };
  if (type === "prepSuccess" || type === "prepFailure") {
    payload.narration = `${options.prepSeason || "Prep"} readiness enters ${s.name} at ${options.prepScore}/16. ${config.narration}`;
  }
  return payload;
}

function cutsceneKicker(type, context) {
  const s = season();
  if (context === "seasonStart") return `${s.name} Handoff`;
  if (type === "peakWin" || type === "missedOpportunity") return `${s.name} Peak Market`;
  if (type === "stormResponse") return "Customer Impact";
  if (type === "reliabilityCrisis") return "Reliability Event";
  return "Operations Moment";
}

function cutsceneStats(type, options = {}) {
  const s = season();
  if (type === "prepSuccess" || type === "prepFailure") {
    return [
      { label: "Readiness", value: `${options.prepScore}/16` },
      { label: "Next Season", value: s.name },
      { label: "Stress Demand", value: `+${formatMw(seasonConfig(s.name).stressDemandBonus || 0)}` },
    ];
  }
  if (type === "reliabilityCrisis") {
    return [
      { label: "Reliability", value: `${s.reliabilityScore}/5` },
      { label: "Emergency Buy", value: `$${s.emergencyPurchases}M` },
      { label: "Shortfall", value: formatMw(capacityShortfall(s)) },
    ];
  }
  if (type === "stormResponse") {
    return [
      { label: "Customers", value: `${s.customerImpactScore}/5` },
      { label: "Reliability", value: `${s.reliabilityScore}/5` },
      { label: "Penalties", value: `$${s.penalties}M` },
    ];
  }
  if (type === "missedOpportunity") {
    return [
      { label: "Market", value: `$${s.marketPrice || 0}/MWh` },
      { label: "Fuel Cost", value: `$${s.fuelCostExpense}M` },
      { label: "Available", value: `${formatMw(s.availableMw || 0)} / ${formatMw(s.demandMw || 0)}` },
    ];
  }
  return [
    { label: "Profit", value: `$${s.profit}M` },
    { label: "Reliability", value: `${s.reliabilityScore}/5` },
    { label: "Prep Revenue", value: `$${s.peakReadinessRevenue}M` },
  ];
}

function capacityShortfall(s) {
  return Math.max(0, (s.demandMw || 0) - (s.availableMw || 0));
}

function recalculate(g) {
  const s = season(g);
  const investments = activeInvestments(g);
  const config = seasonConfig(s.name);
  if (config.preparedBy) s.peakReadinessScore = prepScoreFromSeason(previousPrepSeason(g), g).score;
  g.totalCapitalInvested = g.seasons.reduce((sum, item) => sum + capitalProject(item.selectedCapitalProject).cost, 0);
  s.spend = DATA.assets.reduce((sum, asset) => sum + budgetOption(asset.id, s.selectedBudgetOptions[asset.id]).cost, 0)
    + DATA.fuelStrategies.coal.find((o) => o.id === s.selectedFuelStrategies.coal).cost
    + DATA.fuelStrategies.gas.find((o) => o.id === s.selectedFuelStrategies.gas).cost
    + capitalProject(s.selectedCapitalProject).cost;
  s.unspentBudget = s.budget - s.spend;
  s.capitalCustomerDelta = g.totalCapitalInvested > 200 && !["coalReliability", "hydroModernization", "gridHardening", "renewableStorage", "none"].includes(s.selectedCapitalProject) ? -1 : 0;
  s.availableMw = availableCapacity(g, investments);
  const demand = s.demandMw || 6500;
  const market = DATA.market.find((row) => row.price === (s.marketPrice || 50)) || DATA.market[2];
  const fuel = calculateFuelEconomics(g);
  s.fuelDispatch = { coalMw: fuel.coalMw, gasMw: fuel.gasMw, coalCost: fuel.coalCost, gasCost: fuel.gasCost };
  s.fuelCostExpense = fuel.expense;
  const servedDemand = Math.min(demand, s.availableMw);
  let grossMarketRevenue = Math.round((servedDemand / 1000) * (s.marketPrice || 50) * (config.preparedBy ? 0.62 : 0.48));
  if (s.availableMw < demand * 1.1) grossMarketRevenue = Math.round(grossMarketRevenue * 0.82);
  if (config.preparedBy) grossMarketRevenue = Math.round(grossMarketRevenue * config.peakMarginMultiplier);
  let margin = grossMarketRevenue;
  if (s.selectedBudgetOptions.gas === "flex" && (s.marketPrice || 0) >= 100) margin += 15;
  const outageResolved = Object.keys(s.outageResults).length > 0;
  s.operatingBonus = outageResolved && (s.marketPrice || 0) >= 100
    ? DATA.assets.filter((asset) => asset.id !== "td" && s.selectedOperatingStrategies[asset.id] === "aggressive" && !s.outageResults[asset.id]?.capacityImpactMw).length * 15
    : 0;
  s.grossMarketRevenue = grossMarketRevenue;
  const surplus = s.availableMw - demand;
  s.peakReadinessRevenue = config.preparedBy && surplus >= 0 ? Math.round(s.peakReadinessScore * 4 + Math.min(30, surplus / 100)) : 0;
  s.peakReadinessPenalty = config.preparedBy && s.peakReadinessScore < 7 ? (7 - s.peakReadinessScore) * 10 : 0;
  s.marketMargin = margin + s.eventMarketMargin + s.operatingBonus + s.peakReadinessRevenue;
  const shortfall = Math.max(0, demand - s.availableMw);
  s.emergencyPurchases = shortfall === 0 ? 0 : shortfall <= 500 ? 25 : shortfall <= 1000 ? 75 : shortfall <= 1500 ? 150 : 250;
  s.penalties = s.eventPenalties + s.outagePenalties + s.peakReadinessPenalty;
  s.reliabilityScore = 5 + s.eventReliabilityDelta + s.outageReliabilityDelta + (s.dilemmaReliabilityDelta || 0);
  s.customerImpactScore = 5 + s.eventCustomerDelta + s.outageCustomerDelta + s.capitalCustomerDelta + (s.dilemmaCustomerDelta || 0);
  if (s.peakReadinessPenalty) {
    s.reliabilityScore -= 1;
    s.customerImpactScore -= 1;
  }
  if (shortfall > 0) {
    s.reliabilityScore = Math.min(s.reliabilityScore, shortfall > 1500 ? 1 : shortfall > 1000 ? 2 : 3);
    s.customerImpactScore = Math.min(s.customerImpactScore, shortfall > 1000 ? 2 : 3);
  }
  s.reliabilityScore = clamp(Math.round(s.reliabilityScore), 1, 5);
  s.customerImpactScore = clamp(Math.round(s.customerImpactScore), 1, 5);
  s.profit = Math.round(s.unspentBudget + s.marketMargin + s.subsidyPayments - s.fuelCostExpense - s.emergencyPurchases - s.penalties + (s.dilemmaProfitDelta || 0) + Math.floor(g.totalCapitalInvested / 100) * 8);
  g.totalProfit = g.seasons.reduce((sum, item) => sum + (item.profit || 0), 0);
  g.marketTrend = clamp(g.marketTrend, -3, 3);
  return g;
}

function availableCapacity(g, investments) {
  return DATA.assets.reduce((sum, asset) => {
    if (asset.id === "td") return sum;
    return sum + effectiveAssetCapacity(asset.id, g, investments);
  }, 0);
}

function effectiveAssetCapacity(assetId, g = game, investments = activeInvestments(g)) {
  const s = season(g);
  const asset = assetById(assetId);
  if (!asset || asset.id === "td") return 0;
  const base = asset.id === "hydro" ? (s.hydroAvailableMw || asset.capacityMw) : asset.capacityMw;
  let mw = base + (s.eventCapacityAdjustments[asset.id] || 0) + (s.outageCapacityAdjustments[asset.id] || 0);
  if (asset.id === "renewables" && (s.selectedBudgetOptions.renewables === "storage" || investments.includes("renewableStorage"))) mw += 300;
  if (asset.id === "nuclear" && s.selectedBudgetOptions.nuclear === "enhanced" && (s.demandMw || 0) >= 8000) mw += 200;
  return Math.round(Math.max(0, mw) * opsOption(s.selectedOperatingStrategies[asset.id]).capacityMultiplier);
}

function nextStep() {
  addTransitionLog(game.currentStep);
  if (game.currentStep === "results" && game.currentSeasonIndex === DATA.seasons.length - 1) { screen = "yearEnd"; return; }
  if (game.currentStep === "results") {
    game.currentSeasonIndex += 1;
    game.currentStep = "rolls";
    recalculate(game);
    const s = season();
    const config = seasonConfig(s.name);
    if (config.preparedBy) {
      const prep = prepScoreFromSeason(previousPrepSeason());
      s.peakReadinessScore = prep.score;
      addStageLog(`${s.name} begins with ${config.preparedBy} readiness ${prep.score}/16. Peak demand will add ${formatMw(config.stressDemandBonus)} and margin pays ${config.peakMarginMultiplier}x.`);
      maybeTriggerCutscene("seasonStart", { prepScore: prep.score, prepSeason: config.preparedBy });
    }
    saveGame();
    return;
  }
  game.currentStep = STEPS[Math.min(STEPS.length - 1, STEPS.indexOf(game.currentStep) + 1)];
  if (game.currentStep === "results") maybeTriggerCutscene("results");
  saveGame();
}

function metric(label, value, tone = "") { return `<div class="metric ${tone}"><span>${label}</span><strong>${value}</strong></div>`; }
function choice(o, selected, action, data) { return `<button class="choice ${selected ? "selected" : ""}" data-action="${action}" ${Object.entries(data).map(([k, v]) => `data-${k}="${v}"`).join(" ")}><strong>${o.name}</strong><span>$${o.cost}M</span><em>${o.effect}</em></button>`; }
function budgetFooter() {
  const s = season();
  const over = s.unspentBudget < 0;
  return `<div class="budget-footer ${over ? "over" : ""}"><span>Budget $${s.budget}M</span><strong>Allocated $${s.spend}M</strong><em>${over ? `Over budget by $${Math.abs(s.unspentBudget)}M — trim selections to continue` : `Remaining $${s.unspentBudget}M`}</em></div>`;
}
function fuelEconomicsPanel() {
  const s = season();
  return `
    <div class="fuel-economics">
      <h3>Fuel Economics Drive the Season</h3>
      <div>
        <span><em>Hydro dispatch</em><strong>${formatMw(effectiveAssetCapacity("hydro"))} @ $0/MWh</strong></span>
        <span><em>Coal dispatch</em><strong>${formatMw(s.fuelDispatch.coalMw || 0)} @ $${s.fuelDispatch.coalCost || effectiveFuelCost("coal", s.coalFuelCost || 30, s.selectedFuelStrategies.coal)}/MWh</strong></span>
        <span><em>Gas dispatch</em><strong>${formatMw(s.fuelDispatch.gasMw || 0)} @ $${s.fuelDispatch.gasCost || effectiveFuelCost("gas", s.gasFuelCost || 45, s.selectedFuelStrategies.gas)}/MWh</strong></span>
        <span><em>Projected fuel cost</em><strong>$${s.fuelCostExpense || 0}M</strong></span>
        <span><em>Market price</em><strong>$${s.marketPrice || 0}/MWh</strong></span>
      </div>
      <p>${escapeHtml((s.priceFormation || ["Roll demand and fuel first."]).join(" | "))}</p>
    </div>`;
}
function capacityBar() {
  const s = season();
  const total = Math.max(s.availableMw || 1, s.demandMw || 1);
  return `<div class="capacity-wrap"><div class="capacity-label"><span>Available Capacity</span><strong>${formatMw(s.availableMw || 0)} vs ${formatMw(s.demandMw || 0)} demand</strong></div><div class="capacity-bar">${DATA.assets.filter((a) => a.id !== "td").map((a) => `<span style="width:${Math.max(0, assetAvailable(a.id)) / total * 100}%;background:${COLORS[a.id]}" title="${a.name}"></span>`).join("")}<i style="left:${Math.min(100, (s.demandMw || 0) / total * 100)}%"></i></div></div>`;
}
function assetAvailable(assetId) {
  const asset = assetById(assetId);
  const s = season();
  return Math.max(0, (assetId === "hydro" ? s.hydroAvailableMw || asset.capacityMw : asset.capacityMw) + (s.eventCapacityAdjustments[assetId] || 0) + (s.outageCapacityAdjustments[assetId] || 0));
}
function profitBridge() {
  const s = season();
  const rows = [["Starting budget", s.budget], ["Total spend", -s.spend], ["Unspent budget", s.unspentBudget], ["Gross market revenue", s.marketMargin - s.operatingBonus - s.peakReadinessRevenue], ["Peak readiness revenue", s.peakReadinessRevenue], ["Aggressive ops bonus", s.operatingBonus], ["Renewable payment", s.subsidyPayments], ["Field dispatch", s.dilemmaProfitDelta || 0], ["Fuel cost", -s.fuelCostExpense], ["Emergency purchases", -s.emergencyPurchases], ["Missed prep penalty", -s.peakReadinessPenalty], ["Other penalties", -(s.penalties - s.peakReadinessPenalty)], ["Net profit", s.profit]];
  return `<div class="bridge"><h3>Profit Bridge</h3>${rows.map(([l, v]) => `<div><span>${l}</span><strong>${v < 0 ? "-" : ""}$${Math.abs(v)}M</strong></div>`).join("")}</div>`;
}
function resultLine(name, r) { return `<div class="result-line"><strong>${name}</strong><span>Roll ${r.roll}: ${r.label}</span><em>-${r.capacityImpactMw} MW | -$${r.profitImpact}M</em><p>${r.notes.map(escapeHtml).join(" ")}</p></div>`; }

function activeInvestments(g = game) { return g.seasons.map((s) => s.selectedCapitalProject).filter((id) => id && id !== "none"); }
function seasonConfig(name) { return DATA.seasons.find((item) => item.name === name) || DATA.seasons[0]; }
function previousPrepSeason(g = game) {
  const current = season(g);
  const config = seasonConfig(current.name);
  if (!config.preparedBy) return null;
  return g.seasons.find((item) => item.name === config.preparedBy) || null;
}
function prepScoreFromSeason(source, g = game) {
  if (!source) return { score: 0, lines: ["No prior prep decisions available."] };
  let score = 0;
  const lines = [];
  const budgetWeights = {
    nuclear: { enhanced: 3, standard: 2, min: 0, defer: -2 },
    coal: { boiler: 3, environmental: 2, standard: 2, min: 0, defer: -2 },
    gas: { major: 3, flex: 2, standard: 2, min: 0, defer: -2 },
    renewables: { storage: 3, forecasting: 2, standard: 1, min: 0, defer: -2 },
    hydro: { dam: 2, standard: 1, min: 0, defer: -2 },
    td: { hardening: 3, datacenter: 2, standard: 2, min: 0, defer: -2 },
  };
  for (const asset of DATA.assets) {
    const option = source.selectedBudgetOptions[asset.id];
    const points = budgetWeights[asset.id]?.[option] ?? 0;
    score += points;
    if (points >= 2) lines.push(`${asset.name} ready: ${budgetOption(asset.id, option).name} (+${points}).`);
    if (points < 0) lines.push(`${asset.name} risk carried forward: ${budgetOption(asset.id, option).name} (${points}).`);
  }
  const coal = source.selectedFuelStrategies.coal;
  const gas = source.selectedFuelStrategies.gas;
  if (coal === "inventory") { score += 2; lines.push("Coal inventory protects peak fuel supply (+2)."); }
  else if (["half", "full"].includes(coal)) { score += 1; lines.push("Coal contracting lowers peak fuel exposure (+1)."); }
  if (gas === "transport") { score += 2; lines.push("Firm gas transport protects winter/summer constraints (+2)."); }
  else if (["hedge", "half", "full"].includes(gas)) { score += 1; lines.push("Gas hedge/contract lowers fuel price exposure (+1)."); }
  const project = capitalProject(source.selectedCapitalProject);
  if (project.id !== "none") {
    const capitalPoints = ["gridHardening", "renewableStorage", "gasTransport", "forecastingTools", "dataCenterInterconnect"].includes(project.id) ? 3 : 2;
    score += capitalPoints;
    lines.push(`${project.name} carries into peak operations (+${capitalPoints}).`);
  }
  const normalized = clamp(score, 0, 16);
  return { score: normalized, lines: lines.length ? lines : ["Basic readiness only; no major prep choices selected."] };
}
function season(g = game) { return g.seasons[g.currentSeasonIndex]; }
function budgetOption(asset, id) { return DATA.budgetOptions[asset].find((o) => o.id === id); }
function capitalProject(id) { return DATA.capitalProjects.find((p) => p.id === (id || "none")); }
function opsOption(id) { return DATA.operatingStrategies.find((o) => o.id === id); }
function assetById(id) { return DATA.assets.find((a) => a.id === id); }
function riskThreshold(risk) { return { Low: 1, "Medium-Low": 1, Medium: 2, High: 3, Extreme: 4 }[risk] || 2; }
function outageImpact(id) {
  return {
    nuclear: { mw: 1000, penalty: 50, reliability: 2, note: "Nuclear outage removed 1,000 MW and triggered regulatory concern." },
    coal: { mw: 600, penalty: 25, reliability: 1, note: "Coal forced outage removed 600 MW." },
    gas: { mw: 500, penalty: 20, reliability: 1, note: "Gas forced outage removed 500 MW." },
    renewables: { mw: 300, penalty: 5, reliability: 1, note: "Renewable availability fell below plan." },
    hydro: { mw: 300, penalty: 10, reliability: 1, note: "Hydro forced outage reduced flexibility." },
    td: { mw: 0, penalty: 40, reliability: 3, note: "T&D failure created delivery constraints and customer pain." },
  }[id];
}
function derateImpact(id, result) {
  if (result === "No Derate") return { mw: 0, penalty: 0, note: "No derate." };
  const small = result === "Small Derate";
  const table = {
    nuclear: small ? [300, 10] : [700, 25],
    coal: small ? [300, 10] : [600, 20],
    gas: small ? [300, 10] : [500, 15],
    renewables: small ? [200, 5] : [500, 10],
    hydro: small ? [100, 5] : [300, 10],
    td: small ? [0, 20] : [0, 40],
  };
  const [mw, penalty] = table[id];
  return { mw, penalty, note: `${result} caused ${mw ? `${mw} MW of lost capacity` : "delivery constraints"}.` };
}
function finalRating() {
  const rel = avg(game.seasons.map((s) => s.reliabilityScore));
  const cust = avg(game.seasons.map((s) => s.customerImpactScore));
  if (game.totalProfit > 250 && rel >= 4 && cust >= 4) return "Excellent Operator";
  if (rel >= 4 && game.totalProfit < 150) return "Reliable but Expensive";
  if (game.totalProfit > 250 && rel < 3.5) return "Profitable but Risky";
  if (cust >= 4 && game.totalCapitalInvested < 150) return "Customer-Friendly but Under-Invested";
  if (rel <= 2 || cust <= 2) return "Blackout Learning Experience";
  return "Operational Trouble";
}
function epitaph() {
  const rating = finalRating();
  const lines = {
    "Excellent Operator": "You arrived at year-end with profit, reliability, and most of the crew's goodwill intact. Historians will call it a good year.",
    "Reliable but Expensive": "The lights stayed on. The CFO would like a word.",
    "Profitable but Risky": "The money is real. So is the risk you left in the walls.",
    "Customer-Friendly but Under-Invested": "Customers love you. Your transformers are writing memoirs.",
    "Blackout Learning Experience": "You have died of load shedding.",
    "Operational Trouble": "The year ended. That is the kindest thing the record shows.",
  };
  return lines[rating] || "";
}

function crewReport() {
  return CREW.map((member) => {
    const roughSeasons = game.seasons.filter((s) => s.outageResults?.[member.asset]?.label === "Forced outage").map((s) => s.name);
    const fate = roughSeasons.length === 0
      ? "made it through the whole year without a forced outage."
      : roughSeasons.length === 1
        ? `weathered a forced outage in ${roughSeasons[0]} and does not want to talk about it.`
        : `survived forced outages in ${roughSeasons.join(" and ")}. Send coffee.`;
    return `<li><strong>${member.name}</strong> <span>(${assetById(member.asset).name})</span> — ${fate}</li>`;
  }).join("");
}

function biggestRisk() {
  const deferred = game.seasons.flatMap((s) => Object.entries(s.selectedBudgetOptions).filter(([, v]) => v === "defer").map(([a]) => a));
  return deferred[0] ? `${labelize(deferred[0])} deferred work` : "No major deferral";
}
function rollD6(seed) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) { hash ^= seed.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return (Math.abs(hash) % 6) + 1;
}
function saveGame() { localStorage.setItem(SAVE_KEY, JSON.stringify(game)); }
function loadGame() { try { const raw = localStorage.getItem(SAVE_KEY); return raw ? normalize(JSON.parse(raw)) : null; } catch { return null; } }
function normalize(g) {
  for (const s of g.seasons || []) resetMissing(s);
  if (g.pendingCutscene === undefined) g.pendingCutscene = null;
  return recalculate(g);
}
function resetMissing(s) {
  for (const key of ["eventCapacityAdjustments", "outageCapacityAdjustments", "outageResults", "derateResults", "rolls"]) s[key] ||= {};
  for (const key of ["eventMarketMargin", "eventPenalties", "outagePenalties", "eventReliabilityDelta", "outageReliabilityDelta", "eventCustomerDelta", "outageCustomerDelta", "capitalCustomerDelta", "permanentDemandDelta", "marketTrendDelta", "operatingBonus", "peakReadinessScore", "peakReadinessRevenue", "peakReadinessPenalty", "seasonalStressDemandBonus", "fuelCostExpense", "grossMarketRevenue", "dilemmaProfitDelta", "dilemmaReliabilityDelta", "dilemmaCustomerDelta"]) s[key] ||= 0;
  s.fuelDispatch ||= { coalMw: 0, gasMw: 0, coalCost: 0, gasCost: 0 };
  s.priceFormation ||= [];
  s.stageLog ||= [];
  s.cutscenesShown ||= {};
  if (s.eventApplied === undefined) s.eventApplied = Boolean(s.eventDrawn);
  if (!s.selectedCapitalProject) s.selectedCapitalProject = "none";
}
function valueOf(name) { return document.querySelector(`[name="${name}"]`)?.value || ""; }
function labelize(value) { return value.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()); }
function formatMw(value) { return `${Math.round(value).toLocaleString()} MW`; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function avg(values) { return values.reduce((sum, v) => sum + v, 0) / values.length; }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c])); }

function runSmokeTest() {
  const previousSave = localStorage.getItem(SAVE_KEY);
  localStorage.removeItem(SAVE_KEY);
  game = createNewGame({ gameName: "Smoke Test", seed: "smoke-test" });
  screen = "play";
  resolveRolls({ demand: 4, coal: 3, gas: 3, hydro: 4 });
  const springDilemmaId = season().dilemmaId;
  chooseDilemma(0);
  acknowledgeDilemma();
  game.currentStep = "budget";
  selectBudget("nuclear", "standard");
  selectBudget("coal", "boiler");
  selectBudget("gas", "standard");
  selectBudget("renewables", "forecasting");
  selectBudget("hydro", "standard");
  selectBudget("td", "standard");
  selectFuel("coal", "inventory");
  selectFuel("gas", "transport");
  selectOps("nuclear", "normal");
  selectOps("coal", "normal");
  selectOps("gas", "aggressive");
  selectOps("renewables", "normal");
  selectOps("hydro", "normal");
  selectOps("td", "normal");
  selectCapital("none");
  applyEvent("heatDome");
  resolveOutages();
  game.currentStep = "results";
  const spring = season();
  const springPrepScore = prepScoreFromSeason(spring).score;
  dismissCutscene();
  nextStep();
  const handoffCutsceneType = game.pendingCutscene?.type;
  resolveRolls({ demand: 4, coal: 3, gas: 3, hydro: 4 });
  chooseDilemma(0);
  acknowledgeDilemma();
  const summer = season();
  game.currentStep = "rolls";
  render();
  const dilemmaOk = Boolean(springDilemmaId) && spring.dilemmaChoice === 0 && spring.dilemmaAcked === true && Boolean(summer.dilemmaId) && summer.dilemmaId !== springDilemmaId;
  const ok = summer.name === "Summer" && summer.marketPrice === 150 && summer.demandMw === 7700 && summer.peakReadinessScore === springPrepScore && springPrepScore > 0 && summer.fuelCostExpense > 0 && handoffCutsceneType === "prepSuccess" && dilemmaOk;
  document.body.dataset.smoke = ok ? "ok" : "failed";
  const marker = document.createElement("div");
  marker.id = "smoke-result";
  marker.textContent = ok ? `SMOKE_OK summerDemand=${summer.demandMw} market=${summer.marketPrice} fuel=${summer.fuelCostExpense} readiness=${summer.peakReadinessScore} prepRevenue=${summer.peakReadinessRevenue} cutscene=${handoffCutsceneType} dilemma=${springDilemmaId}` : "SMOKE_FAILED";
  document.body.prepend(marker);
  if (previousSave === null) localStorage.removeItem(SAVE_KEY);
  else localStorage.setItem(SAVE_KEY, previousSave);
}
