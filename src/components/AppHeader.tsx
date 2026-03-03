import { Shield, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AppHeader() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

  return (
    <header className="mess-header h-14 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-olive" />
        <span className="font-rajdhani font-bold text-sm tracking-widest uppercase text-foreground/80">
          Mess Management System
        </span>
        <span className="status-badge px-2 py-0.5 bg-primary/20 text-olive border border-primary/30 rounded">
          OFFLINE
        </span>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock className="w-3.5 h-3.5" />
        <span className="font-mono text-xs">{formatDate(time)}</span>
        <span className="font-mono text-xs text-olive">{formatTime(time)}</span>
      </div>
    </header>
  );
}
