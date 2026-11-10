/**
 * QEVORIN – E-Commerce Pricing & Margin Calculation Engine
 * 
 * Accurately calculates selling price, gross profit, and return metrics for Moroccan e-commerce.
 * Strictly distinguishes between:
 * 
 * 1. Markup on cost:
 *    Selling Price = Cost × (1 + Markup Percentage / 100)
 * 
 * 2. Gross profit margin:
 *    Selling Price = Cost / (1 - Gross Margin Percentage / 100)
 */

export type PricingMethod = 'markup' | 'margin';
export type RoundingOption = 'integer' | 'none' | 'ending9' | 'nearest5' | 'nearest10';

export interface PricingCalculationResult {
  costUSD: number;
  exchangeRate: number;
  costMAD: number; // Converted cost in MAD (costUSD * exchangeRate)
  pricingMethod: PricingMethod;
  inputPercentage: number;
  rawSellingPriceMAD: number;
  roundingOption: RoundingOption;
  finalSellingPriceMAD: number;
  suggestedComparePriceMAD: number;
  grossProfitMAD: number;
  actualGrossMarginPercent: number; // (grossProfit / finalSellingPrice) * 100
  actualMarkupPercent: number; // (grossProfit / costMAD) * 100
}

/**
 * Apply configurable price rounding tailored for Moroccan Dirham (MAD) consumer commerce.
 */
export function applyPriceRounding(rawPrice: number, option: RoundingOption): number {
  if (rawPrice <= 0) return 0;

  switch (option) {
    case 'none':
      return Number(rawPrice.toFixed(2));
    case 'integer':
      return Math.round(rawPrice);
    case 'ending9': {
      // Moroccan charm retail pricing ending in 9 (e.g. 242.84 -> 249 MAD, 420.5 -> 429 MAD)
      const tens = Math.floor(rawPrice / 10);
      const cand = tens * 10 + 9;
      return cand >= rawPrice ? cand : (tens + 1) * 10 + 9;
    }
    case 'nearest5':
      return Math.round(rawPrice / 5) * 5;
    case 'nearest10':
      return Math.round(rawPrice / 10) * 10;
    default:
      return Math.round(rawPrice);
  }
}

/**
 * Calculate complete pricing breakdown with mathematical precision.
 */
export function calculateAliExpressPricing(
  costUSD: number,
  exchangeRate: number,
  method: PricingMethod,
  percentage: number,
  rounding: RoundingOption = 'integer'
): PricingCalculationResult {
  const safeCostUSD = Math.max(0, Number(costUSD) || 0);
  const safeRate = Math.max(0.0001, Number(exchangeRate) || 10.15);
  const safePct = Math.max(0, Number(percentage) || 0);

  // Converted cost in MAD (unrounded exact product for precision)
  const exactCostMAD = safeCostUSD * safeRate;

  let rawSellingPriceMAD = 0;

  if (method === 'markup') {
    // Mode 1: Markup on cost
    // Selling Price = Cost × (1 + Markup Percentage / 100)
    rawSellingPriceMAD = exactCostMAD * (1 + safePct / 100);
  } else {
    // Mode 2: Gross profit margin
    // Selling Price = Cost / (1 - Gross Margin Percentage / 100)
    if (safePct >= 100) {
      // Protect against division by zero/negative prices when gross margin >= 100%
      rawSellingPriceMAD = exactCostMAD * 10;
    } else {
      rawSellingPriceMAD = exactCostMAD / (1 - safePct / 100);
    }
  }

  // Apply chosen price rounding
  const finalSellingPriceMAD = applyPriceRounding(rawSellingPriceMAD, rounding);

  // Gross Profit in MAD = Selling Price - Cost
  const grossProfitMAD = Number((finalSellingPriceMAD - exactCostMAD).toFixed(2));

  // Actual Gross Margin % = (Gross Profit / Selling Price) * 100
  const actualGrossMarginPercent =
    finalSellingPriceMAD > 0
      ? Number(((grossProfitMAD / finalSellingPriceMAD) * 100).toFixed(2))
      : 0;

  // Actual Markup % = (Gross Profit / Cost) * 100
  const actualMarkupPercent =
    exactCostMAD > 0
      ? Number(((grossProfitMAD / exactCostMAD) * 100).toFixed(2))
      : 0;

  // Suggested anchor compare-at price (approx 35% higher)
  const suggestedComparePriceMAD = applyPriceRounding(
    finalSellingPriceMAD * 1.35,
    rounding === 'none' ? 'none' : 'integer'
  );

  return {
    costUSD: safeCostUSD,
    exchangeRate: safeRate,
    costMAD: Number(exactCostMAD.toFixed(2)),
    pricingMethod: method,
    inputPercentage: safePct,
    rawSellingPriceMAD: Number(rawSellingPriceMAD.toFixed(4)),
    roundingOption: rounding,
    finalSellingPriceMAD,
    suggestedComparePriceMAD,
    grossProfitMAD,
    actualGrossMarginPercent,
    actualMarkupPercent,
  };
}
