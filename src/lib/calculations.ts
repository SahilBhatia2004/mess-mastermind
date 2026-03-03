import type { DailyEntry, Soldier, RationItem, MenuEntry } from '../types/mess';

interface AutoCalcInput {
  menuItems: string[]; // itemIds selected
  totalPeople: number;
  dayType: 'Normal' | 'Special';
  previousEntries: DailyEntry[];
  rateList: RationItem[];
}

interface AutoCalcResult {
  menuItems: MenuEntry[];
  perPersonConsumption: Record<string, number>;
  totalEstimatedCost: number;
}

export function autoCalculateConsumption(input: AutoCalcInput): AutoCalcResult {
  const { menuItems, totalPeople, dayType, previousEntries, rateList } = input;

  const result: MenuEntry[] = [];
  const perPersonConsumption: Record<string, number> = {};

  for (const itemId of menuItems) {
    const rateItem = rateList.find(r => r.id === itemId);
    if (!rateItem) continue;

    // Find similar previous entries (same day type, same item)
    const similarEntries = previousEntries.filter(e => {
      const hasItem = e.menuItems.some(m => m.itemId === itemId);
      return hasItem;
    });

    let estimatedGramsPerPerson = 0;

    if (similarEntries.length > 0) {
      // Weighted average: closer entries & same day type weighted more
      let weightedSum = 0;
      let weightTotal = 0;

      for (const entry of similarEntries) {
        const menuItem = entry.menuItems.find(m => m.itemId === itemId);
        if (!menuItem || entry.totalPeople === 0) continue;

        const perPerson = menuItem.quantityUsed / entry.totalPeople;
        const dayTypeWeight = entry.dayType === dayType ? 2 : 1;
        // Recency weight - newer entries have more weight
        const daysAgo = (Date.now() - new Date(entry.date).getTime()) / (1000 * 60 * 60 * 24);
        const recencyWeight = Math.max(0.1, 1 - daysAgo / 90);

        const weight = dayTypeWeight * recencyWeight;
        weightedSum += perPerson * weight;
        weightTotal += weight;
      }

      if (weightTotal > 0) {
        estimatedGramsPerPerson = weightedSum / weightTotal;
      }
    }

    // Fallback to default entitlement average
    if (estimatedGramsPerPerson === 0) {
      estimatedGramsPerPerson = getDefaultEntitlement(rateItem.name, dayType);
    }

    // Scale for special days
    if (dayType === 'Special') {
      estimatedGramsPerPerson *= 1.3;
    }

    const totalQuantity = estimatedGramsPerPerson * totalPeople;
    perPersonConsumption[itemId] = Math.round(estimatedGramsPerPerson);

    result.push({
      itemId,
      itemName: rateItem.name,
      quantityUsed: Math.round(totalQuantity),
    });
  }

  const totalEstimatedCost = result.reduce((sum, item) => {
    const rateItem = rateList.find(r => r.id === item.itemId);
    if (!rateItem) return sum;
    return sum + (item.quantityUsed / 1000) * rateItem.ratePerKg;
  }, 0);

  return { menuItems: result, perPersonConsumption, totalEstimatedCost };
}

function getDefaultEntitlement(itemName: string, dayType: 'Normal' | 'Special'): number {
  const defaults: Record<string, number> = {
    atta: 250, rice: 250, dal: 50, sugar: 50, tea: 17, 'edible oil': 40,
    salt: 34, milk: 250, sabzi: 100, potato: 150, onion: 80, tomato: 60,
  };
  const key = itemName.toLowerCase();
  const base = defaults[key] ?? 100;
  return dayType === 'Special' ? base * 1.3 : base;
}

// Calculate cost for a specific soldier for a daily entry
export function calculateSoldierDailyCost(
  soldier: Soldier,
  dailyEntry: DailyEntry,
  rateList: RationItem[]
): number {
  // If presentSoldierIds is populated, only charge soldiers who were present
  if (
    dailyEntry.presentSoldierIds &&
    dailyEntry.presentSoldierIds.length > 0 &&
    !dailyEntry.presentSoldierIds.includes(soldier.id)
  ) {
    return 0;
  }

  let totalCost = 0;

  for (const menuItem of dailyEntry.menuItems) {
    const perPersonGrams = dailyEntry.perPersonConsumption[menuItem.itemId] ?? 0;
    if (perPersonGrams === 0) continue;

    const rateItem = rateList.find(r => r.id === menuItem.itemId);
    if (!rateItem) continue;

    let chargeableGrams: number;

    if (soldier.rationMoneyAllowance) {
      // RMA = YES: full per-person utilisation charged
      chargeableGrams = perPersonGrams;
    } else {
      // RMA = NO: only excess above entitlement is charged
      const entitlement = soldier.entitlements.find(e => e.itemId === menuItem.itemId);
      const entitlementGrams = entitlement?.gramsPerDay ?? 0;
      chargeableGrams = Math.max(0, perPersonGrams - entitlementGrams);
    }

    // Cost = (chargeable grams / 1000) * rate per kg
    totalCost += (chargeableGrams / 1000) * rateItem.ratePerKg;
  }

  return totalCost;
}

// Calculate mess subs for a soldier for the month
export function calculateMonthlyMessSubs(
  soldier: Soldier,
  month: string, // YYYY-MM
  dailyEntries: DailyEntry[],
  rateList: RationItem[]
): number {
  const monthEntries = dailyEntries.filter(e => e.date.startsWith(month));
  let total = 0;
  for (const entry of monthEntries) {
    total += calculateSoldierDailyCost(soldier, entry, rateList);
  }
  return Math.round(total * 100) / 100;
}
