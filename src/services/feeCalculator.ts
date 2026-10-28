import { CalculationInput, CalculationResult, PlatformConfig } from '../types';
import { getPlatformById } from './customPlatformManager';

export function calculateResellProfit(input: CalculationInput): CalculationResult {
  const {
    sellingPrice = 0,
    purchaseCost = 0,
    sellerShippingCost = 0,
    packagingCost = 0,
    platformId,
    customSellerFeePercent,
    customSellerFixedFee,
  } = input;

  const platform: PlatformConfig = getPlatformById(platformId);

  // Determine seller fee percentages
  const sellerFeePercent =
    platform.id === 'custom' && customSellerFeePercent !== undefined
      ? customSellerFeePercent
      : platform.sellerFeePercent;

  const sellerFixedFee =
    platform.id === 'custom' && customSellerFixedFee !== undefined
      ? customSellerFixedFee
      : platform.sellerFixedFee;

  // Calculate platform seller fee
  const sellerPlatformFee =
    sellingPrice > 0 ? (sellingPrice * (sellerFeePercent / 100)) + sellerFixedFee : 0;

  // Payment processing fee (if applicable, e.g. Depop/Stripe)
  const paymentFee =
    sellingPrice > 0 && platform.paymentProcessingPercent > 0
      ? (sellingPrice * (platform.paymentProcessingPercent / 100)) + platform.paymentProcessingFixed
      : 0;

  const totalSellerFees = Math.max(0, sellerPlatformFee + paymentFee);

  // Buyer fee
  const buyerProtectionFee =
    sellingPrice > 0 && platform.buyerProtectionPercent > 0
      ? (sellingPrice * (platform.buyerProtectionPercent / 100)) + platform.buyerProtectionFixed
      : 0;

  const buyerTotalEstimated = sellingPrice + buyerProtectionFee;

  // Direct costs paid by seller
  const directCosts = purchaseCost + sellerShippingCost + packagingCost;

  // Net amount the seller actually receives in their pocket
  const netReceivedFromPlatform = sellingPrice - totalSellerFees;
  const netProfit = netReceivedFromPlatform - directCosts;

  // Total costs overall
  const totalCosts = directCosts + totalSellerFees;

  // Profit margin: Net Profit / Selling Price
  const marginPercent =
    sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;

  // Return on Investment (ROI): Net Profit / directCosts
  let roiPercent = 0;
  if (directCosts > 0) {
    roiPercent = (netProfit / directCosts) * 100;
  } else if (sellingPrice > 0 && netProfit > 0) {
    roiPercent = 100; // Found for 0€
  }

  return {
    sellingPrice: roundCurrency(sellingPrice),
    purchaseCost: roundCurrency(purchaseCost),
    sellerShippingCost: roundCurrency(sellerShippingCost),
    packagingCost: roundCurrency(packagingCost),
    sellerPlatformFee: roundCurrency(sellerPlatformFee),
    paymentFee: roundCurrency(paymentFee),
    totalSellerFees: roundCurrency(totalSellerFees),
    buyerProtectionFee: roundCurrency(buyerProtectionFee),
    buyerTotalEstimated: roundCurrency(buyerTotalEstimated),
    totalCosts: roundCurrency(totalCosts),
    netProfit: roundCurrency(netProfit),
    marginPercent: Math.round(marginPercent * 10) / 10,
    roiPercent: Math.round(roiPercent * 10) / 10,
  };
}

export function roundCurrency(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

export function formatEuro(val: number): string {
  return `${val.toLocaleString('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}
