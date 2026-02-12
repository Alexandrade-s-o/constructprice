export enum Unit {
  KG = 'kg',
  TON = 'ton',
  BULTO = 'bulto',
  PIEZA = 'pieza',
  M3 = 'm3',
  LITRO = 'litro',
  METRO = 'metro'
}

export enum Category {
  CEMENTOS = 'Cementos y Concretos',
  ACEROS = 'Aceros y Metales',
  ACABADOS = 'Acabados',
  ARENAS = 'Arenas y Gravas',
  LADRILLOS = 'Ladrillos y Blocks',
  ELECTRICO = 'Eléctrico',
  PLOMERIA = 'Plomería',
  MADERA = 'Madera y Formaleta',
  HERRAMIENTAS = 'Herramientas y Equipos'
}

export interface PriceRecord {
  date: string;
  price: number;
}

export interface Material {
  id: string;
  name: string;
  category: Category;
  supplier: string;
  price: number;
  currency: string;
  unit: Unit;
  lastUpdated: string;
  trend: 'up' | 'down' | 'stable';
  url?: string;
  history: PriceRecord[];
  description?: string;
}

export interface KpiData {
  totalMaterials: number;
  avgChange: number;
  topMaterial: string;
}