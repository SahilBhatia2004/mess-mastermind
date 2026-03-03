// Core types for Mess Management System

export interface RationItem {
  id: string;
  name: string;
  ratePerKg: number; // rate per 1000g
  unit: string; // 'g' | 'ml' | 'kg'
}

export interface RateList {
  id: string;
  items: RationItem[];
  uploadedAt: string;
}

export interface SoldierEntitlement {
  itemId: string;
  itemName: string;
  gramsPerDay: number;
}

export interface Soldier {
  id: string;
  serviceNumber: string;
  name: string;
  rank: string;
  rationMoneyAllowance: boolean; // YES = true, NO = false
  entitlements: SoldierEntitlement[];
  createdAt: string;
}

export interface MenuEntry {
  itemId: string;
  itemName: string;
  quantityUsed: number; // in grams
}

export interface DailyEntry {
  id: string;
  date: string;
  dayType: 'Normal' | 'Special';
  totalPeople: number;
  menuItems: MenuEntry[];
  perPersonConsumption: Record<string, number>; // itemId -> grams per person
  totalCost: number;
  createdAt: string;
}

export interface BillCharge {
  date: string;
  description: string;
  amount: number; // in rupees
}

export interface AdditionalCharge {
  name: string;
  amount: number;
}

export interface SoldierBill {
  soldierId: string;
  month: string; // YYYY-MM
  year: number;
  bbfArrears: number;
  teaCoffeeTableMoney: number;
  extraMessing: number;
  barLiqSoftCig: number;
  barProfit: number;
  laundryCharges: number;
  birthdayCakeShare: number;
  messSubs: number; // auto calculated
  mementoSub: number;
  socialGetTogetherShare: number;
  teaRoomBill: number;
  misc2: number;
  advDeposit: number;
  additionalCharges: AdditionalCharge[];
  dailyCharges: BillCharge[];
}

export interface MessConfig {
  messName: string;
  location: string;
  billPrefix: string;
}

// Database structure stored in localStorage
export interface MessDatabase {
  config: MessConfig;
  rateList: RationItem[];
  soldiers: Soldier[];
  dailyEntries: DailyEntry[];
  bills: Record<string, SoldierBill>; // key: soldierId-YYYY-MM
}
