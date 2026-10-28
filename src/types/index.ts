export type PlatformId = 'vinted' | 'ebay' | 'subito' | 'wallapop' | 'depop' | 'custom' | (string & {});

export type ItemStatus = 'listed' | 'sold' | 'shipped' | 'draft';

export interface PlatformConfig {
  id: PlatformId;
  name: string;
  tagline: string;
  color: string;
  badgeBg: string;
  sellerFeePercent: number;
  sellerFixedFee: number;
  buyerProtectionPercent: number;
  buyerProtectionFixed: number;
  paymentProcessingPercent: number;
  paymentProcessingFixed: number;
  description: string;
  isCustom?: boolean;
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
  totalCosts: number;
  netProfit: number;
  marginPercent: number;
  roiPercent: number;
}

export interface InventoryItem {
  id?: number;
  title: string;
  platformId: PlatformId;
  platforms?: PlatformId[];
  quantity?: number;
  purchaseCost: number;
  targetSellingPrice: number;
  actualSellingPrice?: number | null;
  sellerShippingCost: number;
  packagingCost: number;
  status: ItemStatus;
  photoUri?: string | null;
  notes?: string | null;
  createdAt: string;
  soldAt?: string | null;
}
