import { PlatformConfig } from '../types';

export const PLATFORMS: PlatformConfig[] = [
  {
    id: 'vinted',
    name: 'Vinted',
    tagline: '0% fee venditore',
    color: '#09B1BA',
    badgeBg: '#E0F7F8',
    sellerFeePercent: 0,
    sellerFixedFee: 0,
    buyerProtectionPercent: 5,
    buyerProtectionFixed: 0.70,
    paymentProcessingPercent: 0,
    paymentProcessingFixed: 0,
    description: 'La protezione acquisti (0,70€ + 5%) è pagata dall\'acquirente. Il venditore incassa il 100% del prezzo fissato.'
  },
  {
    id: 'ebay',
    name: 'eBay',
    tagline: '~11.5% + 0.35€',
    color: '#E53238',
    badgeBg: '#FCEBEB',
    sellerFeePercent: 11.5,
    sellerFixedFee: 0.35,
    buyerProtectionPercent: 0,
    buyerProtectionFixed: 0,
    paymentProcessingPercent: 0,
    paymentProcessingFixed: 0,
    description: 'Commissione standard venditore privato per la maggior parte delle categorie in Italia.'
  },
  {
    id: 'wallapop',
    name: 'Wallapop',
    tagline: '0% venditore standard',
    color: '#13C1AC',
    badgeBg: '#E2F8F5',
    sellerFeePercent: 0,
    sellerFixedFee: 0,
    buyerProtectionPercent: 5,
    buyerProtectionFixed: 0.80,
    paymentProcessingPercent: 0,
    paymentProcessingFixed: 0,
    description: 'La spedizione e assicurazione sono a carico dell\'acquirente (salvo offerte speciali).'
  },
  {
    id: 'subito',
    name: 'Subito.it',
    tagline: 'TuttoSubito (0% venditore)',
    color: '#FF4A3D',
    badgeBg: '#FFEBEA',
    sellerFeePercent: 0,
    sellerFixedFee: 0,
    buyerProtectionPercent: 4.5,
    buyerProtectionFixed: 0.50,
    paymentProcessingPercent: 0,
    paymentProcessingFixed: 0,
    description: 'Con TuttoSubito la protezione è pagata dal compratore. Incasso al 100% per il venditore.'
  },
  {
    id: 'depop',
    name: 'Depop',
    tagline: '10% + 2.9% transazione',
    color: '#FF2300',
    badgeBg: '#FFE8E5',
    sellerFeePercent: 10,
    sellerFixedFee: 0,
    buyerProtectionPercent: 0,
    buyerProtectionFixed: 0,
    paymentProcessingPercent: 2.9,
    paymentProcessingFixed: 0.30,
    description: 'Commissione di vendita del 10% + fee di elaborazione pagamento (2.9% + 0.30€).'
  },
  {
    id: 'custom',
    name: 'Personalizzato',
    tagline: 'Configura a piacere',
    color: '#6366F1',
    badgeBg: '#EEF2FF',
    sellerFeePercent: 5,
    sellerFixedFee: 0,
    buyerProtectionPercent: 0,
    buyerProtectionFixed: 0,
    paymentProcessingPercent: 0,
    paymentProcessingFixed: 0,
    description: 'Imposta percentuali e costi fissi personalizzati per qualsiasi altro mercatino o negozio.'
  }
];
