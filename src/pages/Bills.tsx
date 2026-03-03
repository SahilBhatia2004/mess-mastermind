import { useState, useEffect } from 'react';
import { db } from '@/lib/database';
import { calculateMonthlyMessSubs, getSoldierDailyCostBreakdown } from '@/lib/calculations';
import { generateBillPDF, generateAllBillsPDF } from '@/lib/billGenerator';
import type { Soldier, SoldierBill } from '@/types/mess';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Download, RefreshCw, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function Bills() {
  const [soldiers, setSoldiers] = useState<Soldier[]>([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [bills, setBills] = useState<Record<string, SoldierBill>>({});
  const [recalculating, setRecalculating] = useState(false);
  const [config] = useState(db.getConfig());
  const [breakdownSoldier, setBreakdownSoldier] = useState<Soldier | null>(null);

  useEffect(() => {
    setSoldiers(db.getSoldiers());
    setBills(db.getAllBills());
  }, []);

  const recalculateSubs = async () => {
    setRecalculating(true);
    const rateList = db.getRateList();
    const dailyEntries = db.getDailyEntries();
    const allSoldiers = db.getSoldiers();

    for (const soldier of allSoldiers) {
      const messSubs = calculateMonthlyMessSubs(soldier, month, dailyEntries, rateList);
      const existing = db.getBill(soldier.id, month);
      const bill: SoldierBill = existing ?? {
        soldierId: soldier.id,
        month,
        year: parseInt(month.split('-')[0]),
        bbfArrears: 0,
        teaCoffeeTableMoney: 0,
        extraMessing: 0,
        barLiqSoftCig: 0,
        barProfit: 0,
        laundryCharges: 0,
        birthdayCakeShare: 0,
        messSubs: 0,
        mementoSub: 0,
        socialGetTogetherShare: 0,
        teaRoomBill: 0,
        misc2: 0,
        advDeposit: 0,
        additionalCharges: [],
        dailyCharges: [],
      };
      bill.messSubs = messSubs;
      db.saveBill(bill);
    }
    setBills(db.getAllBills());
    setRecalculating(false);
  };

  const downloadBill = (soldier: Soldier, idx: number) => {
    const bill = bills[`${soldier.id}-${month}`];
    if (!bill) return;
    generateBillPDF(soldier, bill, config, String(idx + 1).padStart(5, '0'));
  };

  const downloadAll = () => {
    generateAllBillsPDF(soldiers, bills, config, month);
  };

  const monthSoldiers = soldiers.filter(s => bills[`${s.id}-${month}`]);

  const rateList = db.getRateList();
  const dailyEntries = db.getDailyEntries();

  // Build per-day breakdown for selected soldier
  const getBreakdownRows = (soldier: Soldier) => {
    const monthEntries = dailyEntries.filter(e => e.date.startsWith(month));
    return monthEntries
      .filter(entry =>
        !entry.presentSoldierIds?.length || entry.presentSoldierIds.includes(soldier.id)
      )
      .map(entry => ({
        date: entry.date,
        items: getSoldierDailyCostBreakdown(soldier, entry, rateList),
      }))
      .filter(r => r.items.some(i => i.chargeableGrams > 0));
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-rajdhani text-3xl font-bold tracking-wide">BILLS</h1>
          <p className="text-muted-foreground text-sm mt-1">Generate and download individual mess bills</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="h-9 bg-input border-border text-sm w-40"
          />
          <Button
            onClick={recalculateSubs}
            disabled={recalculating}
            variant="outline"
            className="h-9 text-xs font-rajdhani tracking-wide border-border hover:border-primary/40 hover:text-olive gap-1.5"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', recalculating && 'animate-spin')} />
            RECALCULATE SUBS
          </Button>
          <Button
            onClick={downloadAll}
            disabled={monthSoldiers.length === 0}
            className="btn-amber h-9 text-xs font-rajdhani font-semibold tracking-wide gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            DOWNLOAD ALL BILLS
          </Button>
        </div>
      </div>

      {soldiers.length === 0 ? (
        <div className="card-military rounded-lg border border-border p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-rajdhani font-semibold text-lg">No Soldiers Loaded</p>
          <p className="text-sm text-muted-foreground">Upload soldier data first to generate bills</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">Bills for:</span>
            <span className="font-mono text-olive font-semibold">{month}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{monthSoldiers.length} bills generated</span>
            {monthSoldiers.length === 0 && (
              <span className="text-xs text-amber bg-amber/10 border border-amber/20 rounded px-2 py-0.5 font-mono">
                Click "Recalculate Subs" to generate bills for this month
              </span>
            )}
          </div>

          <div className="card-military rounded-lg border border-border overflow-hidden">
            <table className="w-full data-table text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2.5 text-left">#</th>
                  <th className="px-4 py-2.5 text-left">Name</th>
                  <th className="px-4 py-2.5 text-left">Rank</th>
                  <th className="px-4 py-2.5 text-center">RMA</th>
                  <th className="px-4 py-2.5 text-right">Mess Subs</th>
                  <th className="px-4 py-2.5 text-right">Other Charges</th>
                  <th className="px-4 py-2.5 text-right">Total</th>
                  <th className="px-4 py-2.5 text-center">Breakdown</th>
                  <th className="px-4 py-2.5 text-center">Download</th>
                </tr>
              </thead>
              <tbody>
                {soldiers.map((soldier, idx) => {
                  const bill = bills[`${soldier.id}-${month}`];
                  const messSubs = bill?.messSubs ?? 0;
                  const other = bill
                    ? bill.bbfArrears + bill.teaCoffeeTableMoney + bill.extraMessing +
                      bill.barLiqSoftCig + bill.barProfit + bill.laundryCharges +
                      bill.birthdayCakeShare + bill.mementoSub + bill.socialGetTogetherShare +
                      bill.teaRoomBill + bill.misc2 +
                      (bill.additionalCharges || []).reduce((s, c) => s + c.amount, 0)
                    : 0;
                  const total = messSubs + other;

                  return (
                    <tr key={soldier.id} className="border-t border-border hover:bg-primary/5 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-foreground">{soldier.name}</td>
                      <td className="px-4 py-2.5 text-sm text-muted-foreground">{soldier.rank}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={cn('status-badge px-1.5 py-0.5 rounded border text-xs font-rajdhani font-semibold',
                          soldier.rationMoneyAllowance
                            ? 'bg-amber/10 border-amber/30 text-amber'
                            : 'bg-success/10 border-success/30 text-success'
                        )}>
                          {soldier.rationMoneyAllowance ? 'YES' : 'NO'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-sm text-olive">
                        {bill ? `₹${messSubs.toFixed(2)}` : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-sm text-foreground">
                        {bill ? `₹${other.toFixed(2)}` : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-sm font-bold text-foreground">
                        {bill ? `₹${total.toFixed(2)}` : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setBreakdownSoldier(soldier)}
                          disabled={!bill}
                          title="View per-day RMA cost breakdown"
                          className="h-7 text-xs px-2 hover:text-olive disabled:opacity-30"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadBill(soldier, idx)}
                          disabled={!bill}
                          className="h-7 text-xs px-2 hover:text-olive disabled:opacity-30"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* RMA Breakdown Dialog */}
      {breakdownSoldier && (
        <Dialog open={!!breakdownSoldier} onOpenChange={() => setBreakdownSoldier(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-rajdhani text-lg tracking-wide">
                COST BREAKDOWN — {breakdownSoldier.rank} {breakdownSoldier.name}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                RMA: <span className={cn('font-semibold', breakdownSoldier.rationMoneyAllowance ? 'text-amber' : 'text-success')}>
                  {breakdownSoldier.rationMoneyAllowance ? 'YES (full utilisation charged)' : 'NO (only excess above entitlement charged)'}
                </span>
              </p>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {getBreakdownRows(breakdownSoldier).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No chargeable entries found for this month.</p>
              ) : (
                getBreakdownRows(breakdownSoldier).map(row => (
                  <div key={row.date} className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-3 py-1.5 font-rajdhani font-semibold text-xs tracking-wide text-muted-foreground">
                      {row.date}
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-3 py-1.5 text-left text-muted-foreground">Item</th>
                          <th className="px-3 py-1.5 text-right text-muted-foreground">Per Person</th>
                          {!breakdownSoldier.rationMoneyAllowance && (
                            <th className="px-3 py-1.5 text-right text-muted-foreground">Entitlement</th>
                          )}
                          <th className="px-3 py-1.5 text-right text-muted-foreground">Chargeable</th>
                          <th className="px-3 py-1.5 text-right text-muted-foreground">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {row.items.map(item => (
                          <tr key={item.itemName} className="border-t border-border/50">
                            <td className="px-3 py-1.5 font-medium">{item.itemName}</td>
                            <td className="px-3 py-1.5 text-right font-mono">{item.perPersonGrams}g</td>
                            {!breakdownSoldier.rationMoneyAllowance && (
                              <td className="px-3 py-1.5 text-right font-mono text-muted-foreground">{item.entitlementGrams}g</td>
                            )}
                            <td className="px-3 py-1.5 text-right font-mono text-olive">{item.chargeableGrams}g</td>
                            <td className="px-3 py-1.5 text-right font-mono font-semibold">₹{item.cost.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
