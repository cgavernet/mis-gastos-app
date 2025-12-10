export interface Transaction {
  id: string;
  category: string;
  subcategory?: string;
  amount: number;
  date: string; // ISO date string
  icon: string;
  color: string;
  currency: 'USD' | 'ARS';
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  subcategories: string[];
}

export interface CreditCard {
  id: string;
  name: string;
  last4: string;
  network: 'Visa' | 'Visa Débito' | 'Mastercard' | 'Mastercard Débito' | 'American Express' | 'Mercadolibre';
  bgImage: string;
}

export type Period = 'Mensual' | 'Semanal' | 'Anual';
