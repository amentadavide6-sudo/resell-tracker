export type PlatformId = 'vinted' | 'ebay' | 'subito' | 'wallapop' | 'depop' | 'custom';

export interface PlatformConfig {
  id: PlatformId;
  name: string;
  tagline: string;
  color: string;
  badgeBg: string;
  sellerFeePercent: number; // e.g. 10 for 10%
  sellerFixedFee: number; // e.g. 0.35€
  buyerProtectionPercent: number; // e.g. 5%
  buyerProtectionFixed: number; // e.g. 0.70€
  paymentProcessingPercent: number; // e.g. 2.9%
  paymentProcessingFixed: number; // e.g. 0.30€
  description: string;
}

export interface CalculationInput {
  sellingPrice: number;
  purchaseCost: number;
  sellerShippingCost: number;
  packagingCost: number;
  platformId: PlatformId;
  customSellerFeePercent?: number;
  customSellerFixedFee?: number;
}

export interface CalculationResult {
  sellingPrice: number;
  purchaseCost: number;
  sellerShippingCost: number;
  packagingCost: number;
  
  // Platform fees
  sellerPlatformFee: number;
  paymentFee: number;
  totalSellerFees: number;
  
  // Buyer perspective
  buyerProtectionFee: number;
  buyerTotalEstimated: number;
  
  // Totals
  totalCosts: number; // purchase + seller shipping + packaging + fees
  netProfit: number; // sellingPrice - totalCosts
  marginPercent: number; // netProfit / sellingPrice * 100
  roiPercent: number; // netProfit / (purchaseCost + packagingCost + sellerShippingCost) * 100
}
