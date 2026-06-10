export type SeasonName = "Spring" | "Summer" | "Fall" | "Winter";
export type RiskLevel = "Low" | "Medium-Low" | "Medium" | "High" | "Extreme";
export type Difficulty = "Intro" | "Standard" | "Chaos";
export type Step = "home" | "setup" | "rolls" | "budget" | "fuel" | "ops" | "capital" | "event" | "outages" | "results" | "yearEnd" | "how";

export type GameSettings = {
  marketTrend: boolean;
  capitalInvestment: boolean;
  regulatoryTrust: boolean;
  manualRolls: boolean;
  autoRolls: boolean;
  allowDeficitSpending: boolean;
};

export type RollResult = {
  roll: number;
  adjustedRoll?: number;
  occurred: boolean;
  label: string;
  capacityImpactMw: number;
  profitImpact: number;
  notes: string[];
};

export type AssetState = {
  id: string;
  name: string;
  capacityMw: number;
  availableMw: number;
  role: string;
  condition: number;
  eforRisk: RiskLevel;
  derateRisk: RiskLevel | "Weather" | "Water" | "Storm";
  activeEffects: string[];
};

export type SeasonState = {
  name: SeasonName;
  budget: number;
  marketPrice?: number;
  demandMw?: number;
  coalFuelCost?: number;
  gasFuelCost?: number;
  hydroAvailableMw?: number;
  selectedBudgetOptions: Record<string, string>;
  selectedFuelStrategies: Record<string, string>;
  selectedOperatingStrategies: Record<string, string>;
  selectedCapitalProject?: string;
  eventDrawn?: string;
  outageResults: Record<string, RollResult>;
  derateResults: Record<string, RollResult>;
  eventCapacityAdjustments: Record<string, number>;
  outageCapacityAdjustments: Record<string, number>;
  availableMw?: number;
  spend: number;
  unspentBudget: number;
  marketMargin: number;
  eventMarketMargin: number;
  subsidyPayments: number;
  emergencyPurchases: number;
  eventPenalties: number;
  outagePenalties: number;
  penalties: number;
  eventReliabilityDelta: number;
  outageReliabilityDelta: number;
  eventCustomerDelta: number;
  outageCustomerDelta: number;
  capitalCustomerDelta: number;
  profit: number;
  reliabilityScore: number;
  customerImpactScore: number;
  notes: string[];
};

export type GameState = {
  gameId: string;
  gameName: string;
  facilitatorName: string;
  seed: string;
  difficulty: Difficulty;
  currentSeasonIndex: number;
  seasons: SeasonState[];
  assets: Record<string, AssetState>;
  marketTrend: number;
  permanentDemandChangeMw: number;
  totalProfit: number;
  totalCapitalInvested: number;
  regulatoryTrust: number;
  activeInvestments: string[];
  activeProtections: string[];
  settings: GameSettings;
};
