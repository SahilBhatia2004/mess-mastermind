import { useEffect, useState } from 'react';
import { Users, FileText, CalendarDays, TrendingUp, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { db } from '@/lib/database';
import type { Soldier, DailyEntry } from '@/types/mess';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const [soldiers, setSoldiers] = useState<Soldier[]>([]);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [config] = useState(db.getConfig());

  useEffect(() => {
    setSoldiers(db.getSoldiers());
    setEntries(db.getDailyEntries());
  }, []);

  const rateList = db.getRateList();
  const today = new Date().toISOString().split('T')[0];
  const todayEntry = entries.find(e => e.date === today);
  const thisMonth = today.slice(0, 7);
  const monthEntries = entries.filter(e => e.date.startsWith(thisMonth));
  const totalMonthCost = monthEntries.reduce((s, e) => s + e.totalCost, 0);
  const rmaYes = soldiers.filter(s => s.rationMoneyAllowance).length;
  const rmaNo = soldiers.filter(s => !s.rationMoneyAllowance).length;

  const stats = [
    {
      label: 'Total Soldiers',
      value: soldiers.length,
      icon: Users,
      color: 'text-olive',
      bg: 'bg-primary/10',
      border: 'border-primary/20',
    },
    {
      label: 'Rate Items',
      value: rateList.length,
      icon: FileText,
      color: 'text-amber',
      bg: 'bg-accent/10',
      border: 'border-accent/20',
    },
    {
      label: 'Entries This Month',
      value: monthEntries.length,
      icon: CalendarDays,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      label: 'Month Total Cost',
      value: `₹${totalMonthCost.toFixed(0)}`,
      icon: TrendingUp,
      color: 'text-success',
      bg: 'bg-success/10',
      border: 'border-success/20',
    },
  ];

  const systemReady = soldiers.length > 0 && rateList.length > 0;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-rajdhani text-3xl font-bold tracking-wide text-foreground">
            HAVILDAR DASHBOARD
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{config.messName} · {config.location}</p>
        </div>
        <div className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-mono',
          systemReady
            ? 'bg-success/10 border-success/30 text-success'
            : 'bg-amber/10 border-amber/30 text-amber'
        )}>
          {systemReady ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
          {systemReady ? 'SYSTEM READY' : 'SETUP REQUIRED'}
        </div>
      </div>

      {/* Setup prompt if needed */}
      {!systemReady && (
        <div className="card-military rounded-lg p-4 border-amber/30 bg-amber/5 border animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-rajdhani font-semibold text-sm tracking-wide text-foreground">
                System Setup Required
              </p>
              <div className="space-y-1 text-xs text-muted-foreground">
                {rateList.length === 0 && (
                  <p className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger inline-block" />
                    Rate list not uploaded
                  </p>
                )}
                {soldiers.length === 0 && (
                  <p className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger inline-block" />
                    No soldiers imported
                  </p>
                )}
              </div>
              <Link to="/upload">
                <Button size="sm" className="btn-amber h-8 text-xs mt-1 font-rajdhani font-semibold tracking-wide">
                  GO TO UPLOAD DATA
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={cn('card-military rounded-lg p-4 border', border)}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-rajdhani tracking-wider uppercase">{label}</p>
                <p className="text-2xl font-rajdhani font-bold mt-1 text-foreground">{value}</p>
              </div>
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', bg)}>
                <Icon className={cn('w-5 h-5', color)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main action grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Today's entry status */}
        <div className="card-military rounded-lg p-5 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-4 h-4 text-olive" />
            <h3 className="font-rajdhani font-semibold tracking-wide text-sm uppercase">Today's Status</h3>
          </div>
          <p className="text-xs text-muted-foreground font-mono mb-3">{today}</p>
          {todayEntry ? (
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">People Served</span>
                <span className="font-mono text-foreground">{todayEntry.totalPeople}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Day Type</span>
                <span className={cn('status-badge px-1.5 py-0.5 rounded text-xs', todayEntry.dayType === 'Special' ? 'bg-amber/20 text-amber' : 'bg-primary/20 text-olive')}>
                  {todayEntry.dayType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items Served</span>
                <span className="font-mono text-foreground">{todayEntry.menuItems.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. Cost</span>
                <span className="font-mono text-success">₹{todayEntry.totalCost.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No entry for today yet.</p>
          )}
          <Link to="/daily-entry" className="block mt-4">
            <Button size="sm" className="w-full btn-olive h-8 text-xs font-rajdhani tracking-wide">
              {todayEntry ? 'VIEW / EDIT ENTRY' : 'ADD TODAY\'S ENTRY'}
            </Button>
          </Link>
        </div>

        {/* RMA breakdown */}
        <div className="card-military rounded-lg p-5 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-olive" />
            <h3 className="font-rajdhani font-semibold tracking-wide text-sm uppercase">RMA Status</h3>
          </div>
          <div className="space-y-3 mt-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">RMA = YES (Full Charge)</span>
                <span className="font-mono text-foreground">{rmaYes}</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-olive rounded-full transition-all"
                  style={{ width: soldiers.length ? `${(rmaYes / soldiers.length) * 100}%` : '0%' }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">RMA = NO (Excess Only)</span>
                <span className="font-mono text-foreground">{rmaNo}</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber rounded-full transition-all"
                  style={{ width: soldiers.length ? `${(rmaNo / soldiers.length) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </div>
          <Link to="/soldiers" className="block mt-4">
            <Button size="sm" variant="outline" className="w-full h-8 text-xs font-rajdhani tracking-wide border-border hover:border-primary/50 hover:text-olive">
              VIEW SOLDIERS
            </Button>
          </Link>
        </div>

        {/* Quick bills */}
        <div className="card-military rounded-lg p-5 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-olive" />
            <h3 className="font-rajdhani font-semibold tracking-wide text-sm uppercase">Bills</h3>
          </div>
          <div className="space-y-1.5 text-xs mt-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Month</span>
              <span className="font-mono text-foreground">{thisMonth}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Month Entries</span>
              <span className="font-mono text-foreground">{monthEntries.length} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Mess Cost</span>
              <span className="font-mono text-success">₹{totalMonthCost.toFixed(2)}</span>
            </div>
          </div>
          <Link to="/bills" className="block mt-4">
            <Button size="sm" className="w-full btn-amber h-8 text-xs font-rajdhani font-semibold tracking-wide">
              DOWNLOAD ALL BILLS
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent entries table */}
      {entries.length > 0 && (
        <div className="card-military rounded-lg border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="font-rajdhani font-semibold tracking-wide text-sm uppercase">Recent Daily Entries</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full data-table text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Day Type</th>
                  <th className="px-4 py-2 text-right">People</th>
                  <th className="px-4 py-2 text-right">Items</th>
                  <th className="px-4 py-2 text-right">Est. Cost</th>
                </tr>
              </thead>
              <tbody>
                {[...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map((entry) => (
                  <tr key={entry.id} className="border-t border-border hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-2 font-mono text-foreground">{entry.date}</td>
                    <td className="px-4 py-2">
                      <span className={cn('status-badge px-1.5 py-0.5 rounded', entry.dayType === 'Special' ? 'bg-amber/20 text-amber' : 'bg-primary/20 text-olive')}>
                        {entry.dayType}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-right text-foreground">{entry.totalPeople}</td>
                    <td className="px-4 py-2 font-mono text-right text-foreground">{entry.menuItems.length}</td>
                    <td className="px-4 py-2 font-mono text-right text-success">₹{entry.totalCost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
