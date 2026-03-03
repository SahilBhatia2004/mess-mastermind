import { useState } from 'react';
import { db } from '@/lib/database';
import type { MessConfig } from '@/types/mess';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  const [config, setConfig] = useState<MessConfig>(db.getConfig());
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    db.saveConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 max-w-xl space-y-6 animate-fade-in">
      <div>
        <h1 className="font-rajdhani text-3xl font-bold tracking-wide">SETTINGS</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure mess details for bill generation</p>
      </div>

      <div className="card-military rounded-lg border border-border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-4 h-4 text-olive" />
          <h2 className="font-rajdhani font-semibold tracking-wide text-sm uppercase">Mess Details</h2>
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-rajdhani tracking-wide uppercase text-muted-foreground">Mess Name</Label>
            <Input value={config.messName} onChange={e => setConfig({ ...config, messName: e.target.value })} className="bg-input border-border h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-rajdhani tracking-wide uppercase text-muted-foreground">Location</Label>
            <Input value={config.location} onChange={e => setConfig({ ...config, location: e.target.value })} className="bg-input border-border h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-rajdhani tracking-wide uppercase text-muted-foreground">Bill Number Prefix</Label>
            <Input value={config.billPrefix} onChange={e => setConfig({ ...config, billPrefix: e.target.value })} className="bg-input border-border h-9 text-sm font-mono" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} className="btn-olive h-9 text-xs font-rajdhani tracking-wide">SAVE SETTINGS</Button>
          {saved && (
            <div className="flex items-center gap-1.5 text-success text-sm animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              Saved
            </div>
          )}
        </div>
      </div>

      <div className="card-military rounded-lg border border-border p-5 space-y-3">
        <h2 className="font-rajdhani font-semibold tracking-wide text-sm uppercase text-muted-foreground">System Info</h2>
        <div className="space-y-1.5 text-xs">
          {[
            ['Mode', 'Offline / Air-gapped'],
            ['Storage', 'Browser localStorage'],
            ['Soldiers', `${db.getSoldiers().length} loaded`],
            ['Rate Items', `${db.getRateList().length} loaded`],
            ['Daily Entries', `${db.getDailyEntries().length} recorded`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-border/50 pb-1.5">
              <span className="text-muted-foreground">{k}</span>
              <span className="font-mono text-foreground">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
