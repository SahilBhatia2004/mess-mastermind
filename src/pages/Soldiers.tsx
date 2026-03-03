import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/database';
import type { Soldier, AdditionalCharge, SoldierBill } from '@/types/mess';
import { Search, User, Shield, CheckCircle2, XCircle, Plus, Trash2, ChevronDown, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const RANKS_ORDER = [
  'Field Marshal', 'General', 'Lieutenant General', 'Major General', 'Brigadier',
  'Colonel', 'Lieutenant Colonel', 'Major', 'Captain', 'Lieutenant',
  'Havildar Major', 'Havildar', 'Naik', 'Lance Naik', 'Sepoy',
];

function rankOrder(rank: string): number {
  const idx = RANKS_ORDER.findIndex(r => r.toLowerCase() === rank.toLowerCase());
  return idx === -1 ? 99 : idx;
}

interface SoldierProfileModalProps {
  soldier: Soldier;
  onClose: () => void;
}

function SoldierProfileModal({ soldier, onClose }: SoldierProfileModalProps) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [bill, setBill] = useState<SoldierBill>(() => {
    const existing = db.getBill(soldier.id, currentMonth);
    if (existing) return existing;
    return {
      soldierId: soldier.id,
      month: currentMonth,
      year: parseInt(currentMonth.split('-')[0]),
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
  });

  const [newChargeName, setNewChargeName] = useState('');
  const [newChargeAmt, setNewChargeAmt] = useState('');

  const handleSave = () => {
    db.saveBill(bill);
    onClose();
  };

  const addCharge = () => {
    if (!newChargeName || !newChargeAmt) return;
    setBill(b => ({
      ...b,
      additionalCharges: [...(b.additionalCharges || []), { name: newChargeName, amount: parseFloat(newChargeAmt) || 0 }]
    }));
    setNewChargeName('');
    setNewChargeAmt('');
  };

  const removeCharge = (idx: number) => {
    setBill(b => ({ ...b, additionalCharges: b.additionalCharges.filter((_, i) => i !== idx) }));
  };

  const fieldMap = [
    { key: 'bbfArrears', label: 'BBF (Previous Arrears)' },
    { key: 'teaCoffeeTableMoney', label: 'Tea/Coffee/Table Money' },
    { key: 'extraMessing', label: 'Extra Messing' },
    { key: 'barLiqSoftCig', label: 'Bar Liq/Soft/Cig etc' },
    { key: 'barProfit', label: 'Bar Profit' },
    { key: 'laundryCharges', label: 'Laundry Charges' },
    { key: 'birthdayCakeShare', label: 'Birthday Cake Share' },
    { key: 'messSubs', label: 'Mess Subs (Auto-calculated)' },
    { key: 'mementoSub', label: 'Memento Sub' },
    { key: 'socialGetTogetherShare', label: 'Social Get Together Share' },
    { key: 'teaRoomBill', label: 'Tea Room Bill' },
    { key: 'misc2', label: 'Misc 2' },
    { key: 'advDeposit', label: 'Adv Deposit (Credit Balance)' },
  ] as const;

  const total = [
    bill.bbfArrears, bill.teaCoffeeTableMoney, bill.extraMessing,
    bill.barLiqSoftCig, bill.barProfit, bill.laundryCharges,
    bill.birthdayCakeShare, bill.messSubs, bill.mementoSub,
    bill.socialGetTogetherShare, bill.teaRoomBill, bill.misc2,
    ...(bill.additionalCharges || []).map(c => c.amount)
  ].reduce((s, v) => s + v, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div
        className="relative card-military rounded-xl border border-border w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border bg-gradient-card">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <User className="w-6 h-6 text-olive" />
            </div>
            <div>
              <p className="font-rajdhani font-bold text-lg tracking-wide text-foreground">{soldier.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{soldier.serviceNumber} · {soldier.rank}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-mono',
              soldier.rationMoneyAllowance ? 'bg-amber/10 border-amber/30 text-amber' : 'bg-success/10 border-success/30 text-success'
            )}>
              {soldier.rationMoneyAllowance ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              RMA {soldier.rationMoneyAllowance ? 'YES' : 'NO'}
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto scrollbar-thin flex-1">
          {/* Entitlements */}
          <div className="p-5 space-y-3">
            <h3 className="font-rajdhani font-semibold text-sm uppercase tracking-wide text-muted-foreground">Daily Entitlements</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {soldier.entitlements.filter(e => e.gramsPerDay > 0).map(ent => (
                <div key={ent.itemId} className="bg-secondary rounded px-3 py-2">
                  <p className="text-xs text-muted-foreground truncate">{ent.itemName}</p>
                  <p className="font-mono text-sm font-semibold text-olive">{ent.gramsPerDay}g</p>
                </div>
              ))}
              {soldier.entitlements.filter(e => e.gramsPerDay > 0).length === 0 && (
                <p className="text-xs text-muted-foreground col-span-3">No entitlements recorded</p>
              )}
            </div>
          </div>

          {/* Bill charges */}
          <div className="px-5 pb-5 space-y-3">
            <h3 className="font-rajdhani font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Bill Charges · {currentMonth}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {fieldMap.map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs text-muted-foreground">{label}</label>
                  <Input
                    type="number"
                    value={bill[key as keyof SoldierBill] as number}
                    onChange={(e) => setBill(b => ({ ...b, [key]: parseFloat(e.target.value) || 0 }))}
                    className={cn('h-8 text-xs font-mono bg-input border-border', key === 'messSubs' && 'border-olive/40 text-olive')}
                  />
                </div>
              ))}
            </div>

            {/* Additional charges */}
            <div className="space-y-2">
              <h4 className="text-xs font-rajdhani font-semibold tracking-wide uppercase text-muted-foreground">Additional Charges</h4>
              {(bill.additionalCharges || []).map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs flex-1 text-foreground">{c.name}</span>
                  <span className="font-mono text-xs text-olive">₹{c.amount}</span>
                  <button onClick={() => removeCharge(i)} className="text-muted-foreground hover:text-danger">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input placeholder="Charge name" value={newChargeName} onChange={e => setNewChargeName(e.target.value)} className="h-8 text-xs bg-input border-border flex-1" />
                <Input type="number" placeholder="₹ Amount" value={newChargeAmt} onChange={e => setNewChargeAmt(e.target.value)} className="h-8 text-xs font-mono bg-input border-border w-28" />
                <Button size="sm" onClick={addCharge} className="h-8 btn-olive text-xs px-3">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center px-3 py-2 bg-secondary rounded border border-border">
              <span className="font-rajdhani font-semibold text-sm tracking-wide">TOTAL</span>
              <span className="font-mono text-lg font-bold text-olive">₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">Cancel</Button>
          <Button size="sm" className="btn-olive h-8 text-xs font-rajdhani tracking-wide" onClick={handleSave}>
            SAVE BILL DATA
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Soldiers() {
  const [soldiers, setSoldiers] = useState<Soldier[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSoldier, setSelectedSoldier] = useState<Soldier | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'rank' | 'rma'>('rank');

  useEffect(() => {
    setSoldiers(db.getSoldiers());
  }, []);

  const filtered = soldiers
    .filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.serviceNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.rank.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'rank') return rankOrder(a.rank) - rankOrder(b.rank);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return Number(b.rationMoneyAllowance) - Number(a.rationMoneyAllowance);
    });

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-rajdhani text-3xl font-bold tracking-wide">SOLDIERS</h1>
          <p className="text-muted-foreground text-sm mt-1">{soldiers.length} soldiers · Double-click to open profile & bill</p>
        </div>
        <div className="flex gap-2">
          {(['rank', 'name', 'rma'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={cn(
                'px-3 py-1 rounded text-xs font-rajdhani font-semibold tracking-wide uppercase border transition-colors',
                sortBy === s
                  ? 'bg-primary/20 border-primary/40 text-olive'
                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, service number, or rank..."
          className="pl-9 bg-input border-border h-10"
        />
      </div>

      {soldiers.length === 0 ? (
        <div className="card-military rounded-lg border border-border p-12 text-center">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-rajdhani font-semibold text-lg">No Soldiers Loaded</p>
          <p className="text-sm text-muted-foreground">Upload soldier data from the Upload Data page</p>
        </div>
      ) : (
        <div className="card-military rounded-lg border border-border overflow-hidden">
          <table className="w-full data-table text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2.5 text-left">#</th>
                <th className="px-4 py-2.5 text-left">Name</th>
                <th className="px-4 py-2.5 text-left">Service No.</th>
                <th className="px-4 py-2.5 text-left">Rank</th>
                <th className="px-4 py-2.5 text-center">RMA</th>
                <th className="px-4 py-2.5 text-right">Entitlements</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr
                  key={s.id}
                  className="border-t border-border hover:bg-primary/5 cursor-pointer transition-colors group"
                  onDoubleClick={() => setSelectedSoldier(s)}
                  onClick={() => setSelectedSoldier(s)}
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-foreground group-hover:text-olive transition-colors">{s.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-foreground">{s.serviceNumber}</td>
                  <td className="px-4 py-2.5 text-sm text-foreground">{s.rank}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={cn('status-badge px-2 py-0.5 rounded border',
                      s.rationMoneyAllowance
                        ? 'bg-amber/10 border-amber/30 text-amber'
                        : 'bg-success/10 border-success/30 text-success'
                    )}>
                      {s.rationMoneyAllowance ? 'YES' : 'NO'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-muted-foreground font-mono">
                    {s.entitlements.filter(e => e.gramsPerDay > 0).length} items
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">No soldiers match your search.</div>
          )}
        </div>
      )}

      {selectedSoldier && (
        <SoldierProfileModal soldier={selectedSoldier} onClose={() => setSelectedSoldier(null)} />
      )}
    </div>
  );
}
