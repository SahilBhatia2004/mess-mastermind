import { useState, useEffect, useRef } from 'react';
import { db, genId } from '@/lib/database';
import type { DailyEntry, MenuEntry, RationItem } from '@/types/mess';
import { autoCalculateConsumption } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { CalendarDays, Zap, Plus, Trash2, Save, CheckCircle2, Users, X } from 'lucide-react';

export default function DailyEntry() {
  const rateList = db.getRateList();
  const allSoldiers = db.getSoldiers();
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [dayType, setDayType] = useState<'Normal' | 'Special'>('Normal');
  const [totalPeople, setTotalPeople] = useState(50);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [menuItems, setMenuItems] = useState<MenuEntry[]>([]);
  const [perPersonConsumption, setPerPersonConsumption] = useState<Record<string, number>>({});
  const [presentSoldierIds, setPresentSoldierIds] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [searchItem, setSearchItem] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [soldierSearch, setSoldierSearch] = useState('');
  const [showSoldierDropdown, setShowSoldierDropdown] = useState(false);
  const soldierSearchRef = useRef<HTMLInputElement>(null);

  // Load existing entry for the date
  useEffect(() => {
    const existing = db.getEntriesByDate(date)[0];
    if (existing) {
      setDayType(existing.dayType);
      setTotalPeople(existing.totalPeople);
      setSelectedItems(existing.menuItems.map(m => m.itemId));
      setMenuItems(existing.menuItems);
      setPerPersonConsumption(existing.perPersonConsumption);
      setPresentSoldierIds(existing.presentSoldierIds ?? []);
    } else {
      setSelectedItems([]);
      setMenuItems([]);
      setPerPersonConsumption({});
      setPresentSoldierIds([]);
    }
    setSaved(false);
  }, [date]);

  const filteredItems = rateList.filter(
    r => r.name.toLowerCase().includes(searchItem.toLowerCase()) && !selectedItems.includes(r.id)
  );

  const filteredSoldiers = allSoldiers.filter(
    s =>
      (s.name.toLowerCase().includes(soldierSearch.toLowerCase()) ||
        s.serviceNumber.toLowerCase().includes(soldierSearch.toLowerCase())) &&
      !presentSoldierIds.includes(s.id)
  );

  const addItem = (item: RationItem) => {
    setSelectedItems(prev => [...prev, item.id]);
    setMenuItems(prev => [...prev, { itemId: item.id, itemName: item.name, quantityUsed: 0 }]);
    setSearchItem('');
    setShowDropdown(false);
  };

  const removeItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(id => id !== itemId));
    setMenuItems(prev => prev.filter(m => m.itemId !== itemId));
    setPerPersonConsumption(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const updateQty = (itemId: string, qty: number) => {
    setMenuItems(prev => prev.map(m => m.itemId === itemId ? { ...m, quantityUsed: qty } : m));
    const headcount = presentSoldierIds.length > 0 ? presentSoldierIds.length : totalPeople;
    if (headcount > 0) {
      setPerPersonConsumption(prev => ({ ...prev, [itemId]: Math.round(qty / headcount) }));
    }
  };

  const addSoldier = (soldierId: string) => {
    setPresentSoldierIds(prev => [...prev, soldierId]);
    setSoldierSearch('');
    setShowSoldierDropdown(false);
  };

  const removeSoldier = (soldierId: string) => {
    setPresentSoldierIds(prev => prev.filter(id => id !== soldierId));
  };

  const effectiveHeadcount = presentSoldierIds.length > 0 ? presentSoldierIds.length : totalPeople;

  const autoCalculate = () => {
    if (selectedItems.length === 0 || effectiveHeadcount === 0) return;
    const result = autoCalculateConsumption({
      menuItems: selectedItems,
      totalPeople: effectiveHeadcount,
      dayType,
      previousEntries: db.getDailyEntries(),
      rateList,
    });
    setMenuItems(result.menuItems);
    setPerPersonConsumption(result.perPersonConsumption);
  };

  const totalCost = menuItems.reduce((sum, item) => {
    const rateItem = rateList.find(r => r.id === item.itemId);
    if (!rateItem) return sum;
    return sum + (item.quantityUsed / 1000) * rateItem.ratePerKg;
  }, 0);

  const handleSave = () => {
    const existing = db.getEntriesByDate(date)[0];
    const entry: DailyEntry = {
      id: existing?.id ?? genId(),
      date,
      dayType,
      totalPeople: effectiveHeadcount,
      presentSoldierIds,
      menuItems,
      perPersonConsumption,
      totalCost,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    db.saveDailyEntry(entry);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in max-w-4xl">
      <div>
        <h1 className="font-rajdhani text-3xl font-bold tracking-wide">DAILY ENTRY</h1>
        <p className="text-muted-foreground text-sm mt-1">Record daily menu, consumption and auto-calculate costs</p>
      </div>

      {rateList.length === 0 ? (
        <div className="card-military rounded-lg border border-amber/30 bg-amber/5 p-6 text-center">
          <p className="font-rajdhani font-semibold">No rate list loaded. Please upload rate list first.</p>
        </div>
      ) : (
        <>
          {/* Day config */}
          <div className="card-military rounded-lg border border-border p-5 space-y-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-olive" />
              <h2 className="font-rajdhani font-semibold tracking-wide text-sm uppercase">Day Configuration</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide font-rajdhani">Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="h-9 bg-input border-border text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide font-rajdhani">Day Type</Label>
                <div className="flex gap-1 h-9">
                  {(['Normal', 'Special'] as const).map(dt => (
                    <button
                      key={dt}
                      onClick={() => setDayType(dt)}
                      className={cn(
                        'flex-1 rounded text-xs font-rajdhani font-semibold tracking-wide border transition-colors',
                        dayType === dt
                          ? dt === 'Special'
                            ? 'bg-amber/20 border-amber/40 text-amber'
                            : 'bg-primary/20 border-primary/40 text-olive'
                          : 'border-border text-muted-foreground hover:border-primary/30'
                      )}
                    >
                      {dt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide font-rajdhani">
                  {presentSoldierIds.length > 0 ? 'Present Soldiers' : 'Total People'}
                </Label>
                {presentSoldierIds.length > 0 ? (
                  <div className="h-9 flex items-center px-3 bg-secondary rounded border border-border font-mono text-sm text-olive font-semibold">
                    {presentSoldierIds.length} soldiers
                  </div>
                ) : (
                  <Input
                    type="number"
                    value={totalPeople}
                    onChange={e => setTotalPeople(parseInt(e.target.value) || 0)}
                    className="h-9 bg-input border-border text-sm font-mono"
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide font-rajdhani">Est. Total Cost</Label>
                <div className="h-9 flex items-center px-3 bg-secondary rounded border border-border font-mono text-sm text-olive font-semibold">
                  ₹{totalCost.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Soldier attendance */}
          <div className="card-military rounded-lg border border-border p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-olive" />
              <h2 className="font-rajdhani font-semibold tracking-wide text-sm uppercase">Soldiers Present Today</h2>
              <span className="ml-auto text-xs text-muted-foreground font-rajdhani">
                {presentSoldierIds.length === 0
                  ? 'If none selected, bill divides among all soldiers'
                  : `${presentSoldierIds.length} of ${allSoldiers.length} selected — bill divided among them only`}
              </span>
            </div>

            {allSoldiers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No soldiers in database. Upload soldier data first.</p>
            ) : (
              <>
                {/* Soldier search dropdown */}
                <div className="relative">
                  <Input
                    ref={soldierSearchRef}
                    value={soldierSearch}
                    onChange={e => { setSoldierSearch(e.target.value); setShowSoldierDropdown(true); }}
                    onFocus={() => setShowSoldierDropdown(true)}
                    placeholder="Search soldier by name or service number..."
                    className="h-9 bg-input border-border text-sm"
                  />
                  {showSoldierDropdown && filteredSoldiers.length > 0 && (
                    <div className="absolute z-20 top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-card overflow-hidden max-h-48 overflow-y-auto scrollbar-thin">
                      {filteredSoldiers.map(s => (
                        <button
                          key={s.id}
                          onClick={() => addSoldier(s.id)}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-secondary transition-colors text-left"
                        >
                          <span className="font-medium">{s.name}</span>
                          <span className="text-xs text-muted-foreground font-mono">{s.rank} · {s.serviceNumber}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {showSoldierDropdown && (
                    <div className="fixed inset-0 z-10" onClick={() => setShowSoldierDropdown(false)} />
                  )}
                </div>

                {/* Selected soldiers chips */}
                {presentSoldierIds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {presentSoldierIds.map(id => {
                      const s = allSoldiers.find(x => x.id === id);
                      if (!s) return null;
                      return (
                        <div
                          key={id}
                          className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 text-olive rounded-full px-3 py-1 text-xs font-rajdhani font-semibold"
                        >
                          <span>{s.rank} {s.name}</span>
                          <button
                            onClick={() => removeSoldier(id)}
                            className="hover:text-danger transition-colors ml-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                    <button
                      onClick={() => setPresentSoldierIds([])}
                      className="text-xs text-muted-foreground hover:text-danger transition-colors underline underline-offset-2 px-1"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Menu item selection */}
          <div className="card-military rounded-lg border border-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-rajdhani font-semibold tracking-wide text-sm uppercase">Menu Items</h2>
              <Button
                onClick={autoCalculate}
                disabled={selectedItems.length === 0 || effectiveHeadcount === 0}
                className="btn-amber h-8 text-xs font-rajdhani font-semibold tracking-wide gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                AUTO CALCULATE
              </Button>
            </div>

            {/* Search dropdown */}
            <div className="relative">
              <Input
                value={searchItem}
                onChange={e => { setSearchItem(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Type to search and add menu items..."
                className="h-9 bg-input border-border text-sm"
              />
              {showDropdown && filteredItems.length > 0 && (
                <div className="absolute z-20 top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-card overflow-hidden max-h-48 overflow-y-auto scrollbar-thin">
                  {filteredItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => addItem(item)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-secondary transition-colors text-left"
                    >
                      <span>{item.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">₹{item.ratePerKg}/kg</span>
                    </button>
                  ))}
                </div>
              )}
              {showDropdown && (
                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
              )}
            </div>

            {/* Selected items table */}
            {menuItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full data-table text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left">Item</th>
                      <th className="px-3 py-2 text-right">Qty Used (g)</th>
                      <th className="px-3 py-2 text-right">Per Person (g)</th>
                      <th className="px-3 py-2 text-right">Cost</th>
                      <th className="px-3 py-2 text-center">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuItems.map(item => {
                      const rate = rateList.find(r => r.id === item.itemId);
                      const cost = rate ? (item.quantityUsed / 1000) * rate.ratePerKg : 0;
                      const perPerson = perPersonConsumption[item.itemId] ?? 0;
                      return (
                        <tr key={item.itemId} className="border-t border-border">
                          <td className="px-3 py-2 font-medium">{item.itemName}</td>
                          <td className="px-3 py-2 text-right">
                            <Input
                              type="number"
                              value={item.quantityUsed}
                              onChange={e => updateQty(item.itemId, parseFloat(e.target.value) || 0)}
                              className="h-7 text-xs font-mono bg-input border-border w-24 ml-auto text-right"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-xs text-muted-foreground">{perPerson}g</td>
                          <td className="px-3 py-2 text-right font-mono text-xs text-olive">₹{cost.toFixed(2)}</td>
                          <td className="px-3 py-2 text-center">
                            <button onClick={() => removeItem(item.itemId)} className="text-muted-foreground hover:text-danger transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <Plus className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Search and add menu items above
              </div>
            )}
          </div>

          {/* Per person breakdown */}
          {menuItems.length > 0 && effectiveHeadcount > 0 && (
            <div className="card-military rounded-lg border border-border p-5 space-y-3">
              <h2 className="font-rajdhani font-semibold tracking-wide text-sm uppercase">Per Person Utilisation</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {menuItems.map(item => {
                  const perPerson = perPersonConsumption[item.itemId] ?? 0;
                  return (
                    <div key={item.itemId} className="bg-secondary rounded p-3">
                      <p className="text-xs text-muted-foreground truncate">{item.itemName}</p>
                      <p className="font-mono text-base font-bold text-olive">{perPerson}g</p>
                      <p className="text-xs text-muted-foreground">per person</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Save */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={menuItems.length === 0}
              className="btn-olive font-rajdhani font-semibold tracking-wide gap-2"
            >
              <Save className="w-4 h-4" />
              SAVE DAILY ENTRY
            </Button>
            {saved && (
              <div className="flex items-center gap-1.5 text-success text-sm animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                Saved successfully
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
