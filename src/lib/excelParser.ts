import * as XLSX from 'xlsx';
import { db, genId } from './database';
import type { Soldier, RationItem, SoldierEntitlement } from '../types/mess';

// Normalize column/item names for robust matching
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[_\s]+/g, ' ')         // normalize whitespace/underscores
    .trim();
}

// Multi-tier match: exact → starts-with → contains
function fuzzyMatchItem(items: RationItem[], key: string): RationItem | undefined {
  const nKey = normalizeName(key);
  return (
    items.find(r => normalizeName(r.name) === nKey) ??
    items.find(r => normalizeName(r.name).startsWith(nKey) || nKey.startsWith(normalizeName(r.name))) ??
    items.find(r => normalizeName(r.name).includes(nKey) || nKey.includes(normalizeName(r.name)))
  );
}

export interface ExcelParseResult {
  success: boolean;
  message: string;
  count?: number;
}

// Parse soldier Excel file
// Expected columns: Name, Service Number, Rank, RMA (YES/NO), then item columns (item_name_g)
export function parseSoldierExcel(file: File): Promise<ExcelParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

        if (rows.length === 0) {
          resolve({ success: false, message: 'Excel file is empty.' });
          return;
        }

        const rateList = db.getRateList();
        const soldiers: Soldier[] = [];

        const standardCols = new Set([
          'name', 'service number', 'service_number', 'servicenumber',
          'rank', 'rma', 'ration money allowance', 'ration_money_allowance',
        ]);

        for (const row of rows) {
          const name = String(row['Name'] || row['name'] || '').trim();
          const serviceNumber = String(row['Service Number'] || row['service_number'] || row['ServiceNumber'] || '').trim();
          const rank = String(row['Rank'] || row['rank'] || '').trim();
          const rmaRaw = String(row['RMA'] || row['Ration Money Allowance'] || row['ration_money_allowance'] || 'NO').trim().toUpperCase();
          const rma = rmaRaw === 'YES' || rmaRaw === 'Y' || rmaRaw === '1';

          if (!name || !serviceNumber) continue;

          // Parse entitlements from ALL non-standard columns using fuzzy matching
          const entitlements: SoldierEntitlement[] = [];

          for (const key of Object.keys(row)) {
            if (standardCols.has(normalizeName(key))) continue;

            const rawVal = row[key];
            const val = rawVal !== '' ? (parseFloat(String(rawVal)) || 0) : 0;

            // Use fuzzy match to find rate list item, store exact Excel column name as itemName
            const matchedItem = fuzzyMatchItem(rateList, key);
            entitlements.push({
              itemId: matchedItem ? matchedItem.id : genId(),
              itemName: matchedItem ? matchedItem.name : key.trim(), // use canonical name from rate list when matched
              gramsPerDay: val,
            });
          }

          soldiers.push({
            id: genId(),
            serviceNumber,
            name,
            rank,
            rationMoneyAllowance: rma,
            entitlements,
            createdAt: new Date().toISOString(),
          });
        }

        db.saveSoldiers(soldiers);
        resolve({ success: true, message: `Successfully imported ${soldiers.length} soldiers.`, count: soldiers.length });
      } catch (err) {
        resolve({ success: false, message: `Parse error: ${err instanceof Error ? err.message : 'Unknown error'}` });
      }
    };
    reader.readAsBinaryString(file);
  });
}

// Parse rate list Excel
// Expected columns: Item Name, Rate (per 1000g), Unit
export function parseRateListExcel(file: File): Promise<ExcelParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

        if (rows.length === 0) {
          resolve({ success: false, message: 'Rate list file is empty.' });
          return;
        }

        const items: RationItem[] = [];
        for (const row of rows) {
          const name = String(row['Item Name'] || row['item_name'] || row['Name'] || row['Item'] || '').trim();
          const rate = parseFloat(String(row['Rate'] || row['rate'] || row['Rate per 1000g'] || row['Rate (per 1000g)'] || 0));
          const unit = String(row['Unit'] || row['unit'] || 'g').trim() || 'g';

          if (!name || !rate) continue;
          items.push({ id: genId(), name, ratePerKg: rate, unit });
        }

        db.saveRateList(items);
        resolve({ success: true, message: `Successfully imported ${items.length} rate items.`, count: items.length });
      } catch (err) {
        resolve({ success: false, message: `Parse error: ${err instanceof Error ? err.message : 'Unknown error'}` });
      }
    };
    reader.readAsBinaryString(file);
  });
}

// Generate sample Excel templates for download
export function downloadSoldierTemplate(rateItems: RationItem[]): void {
  const headers: Record<string, unknown> = {
    'Name': 'Jitesh Rajendra Deshmukh',
    'Service Number': 'IC-12345',
    'Rank': 'Field Marshal',
    'RMA': 'NO',
  };
  for (const item of rateItems) {
    headers[item.name] = 250;
  }
  const ws = XLSX.utils.json_to_sheet([headers]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Soldiers');
  XLSX.writeFile(wb, 'soldier_template.xlsx');
}

export function downloadRateListTemplate(): void {
  const sample = [
    { 'Item Name': 'Atta', 'Rate': 25, 'Unit': 'g' },
    { 'Item Name': 'Rice', 'Rate': 25, 'Unit': 'g' },
    { 'Item Name': 'Dal', 'Rate': 5, 'Unit': 'g' },
    { 'Item Name': 'Sugar', 'Rate': 3, 'Unit': 'g' },
    { 'Item Name': 'Tea', 'Rate': 17, 'Unit': 'g' },
    { 'Item Name': 'Edible Oil', 'Rate': 2, 'Unit': 'ml' },
    { 'Item Name': 'Salt', 'Rate': 34, 'Unit': 'g' },
    { 'Item Name': 'Milk', 'Rate': 1, 'Unit': 'ml' },
  ];
  const ws = XLSX.utils.json_to_sheet(sample);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'RateList');
  XLSX.writeFile(wb, 'rate_list_template.xlsx');
}
