import type { MessDatabase, Soldier, RationItem, DailyEntry, SoldierBill, MessConfig } from '../types/mess';

const DB_KEY = 'mess_management_db';

const defaultDB: MessDatabase = {
  config: {
    messName: 'INFANTRY OFFRS MESS',
    location: '29, THE MALL, DELHI CANTT -10',
    billPrefix: '000',
  },
  rateList: [],
  soldiers: [],
  dailyEntries: [],
  bills: {},
};

export const db = {
  get(): MessDatabase {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (!raw) return { ...defaultDB };
      return JSON.parse(raw) as MessDatabase;
    } catch {
      return { ...defaultDB };
    }
  },

  save(data: MessDatabase): void {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  },

  // Config
  getConfig(): MessConfig {
    return this.get().config;
  },
  saveConfig(config: MessConfig): void {
    const data = this.get();
    data.config = config;
    this.save(data);
  },

  // Rate List
  getRateList(): RationItem[] {
    return this.get().rateList;
  },
  saveRateList(items: RationItem[]): void {
    const data = this.get();
    data.rateList = items;
    this.save(data);
  },

  // Soldiers
  getSoldiers(): Soldier[] {
    return this.get().soldiers;
  },
  saveSoldiers(soldiers: Soldier[]): void {
    const data = this.get();
    data.soldiers = soldiers;
    this.save(data);
  },
  getSoldier(id: string): Soldier | undefined {
    return this.getSoldiers().find(s => s.id === id);
  },
  updateSoldier(soldier: Soldier): void {
    const data = this.get();
    const idx = data.soldiers.findIndex(s => s.id === soldier.id);
    if (idx >= 0) data.soldiers[idx] = soldier;
    this.save(data);
  },

  // Daily Entries
  getDailyEntries(): DailyEntry[] {
    return this.get().dailyEntries;
  },
  saveDailyEntry(entry: DailyEntry): void {
    const data = this.get();
    const idx = data.dailyEntries.findIndex(e => e.id === entry.id);
    if (idx >= 0) data.dailyEntries[idx] = entry;
    else data.dailyEntries.push(entry);
    this.save(data);
  },
  getEntriesByDate(date: string): DailyEntry[] {
    return this.getDailyEntries().filter(e => e.date === date);
  },

  // Bills
  getBill(soldierId: string, month: string): SoldierBill | undefined {
    const data = this.get();
    return data.bills[`${soldierId}-${month}`];
  },
  saveBill(bill: SoldierBill): void {
    const data = this.get();
    data.bills[`${bill.soldierId}-${bill.month}`] = bill;
    this.save(data);
  },
  getAllBills(): Record<string, SoldierBill> {
    return this.get().bills;
  },

  // Reset
  reset(): void {
    localStorage.removeItem(DB_KEY);
  },
};

// Generate unique ID
export const genId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2);
