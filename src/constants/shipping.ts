export interface ShippingPreset {
  id: string;
  label: string;
  cost: number;
  description: string;
  tag: string;
}

export const SHIPPING_PRESETS: ShippingPreset[] = [
  {
    id: 'free',
    label: 'Gratis / Ritiro',
    cost: 0,
    description: 'A carico acquirente o scambio a mano',
    tag: '0 €',
  },
  {
    id: 'inpost',
    label: 'InPost Locker',
    cost: 3.50,
    description: 'Spedizione locker o punto di ritiro',
    tag: '3,50 €',
  },
  {
    id: 'poste',
    label: 'Poste Delivery',
    cost: 5.90,
    description: 'Pacco standard fino a 2 kg',
    tag: '5,90 €',
  },
  {
    id: 'courier',
    label: 'Corriere 24h',
    cost: 7.50,
    description: 'BRT / GLS / DHL espresso',
    tag: '7,50 €',
  },
];
