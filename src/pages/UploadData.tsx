import { useState } from 'react';
import { parseSoldierExcel, parseRateListExcel, downloadSoldierTemplate, downloadRateListTemplate } from '@/lib/excelParser';
import FileUploadZone from '@/components/FileUploadZone';
import { db } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Database, Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function UploadData() {
  const [config, setConfig] = useState(db.getConfig());
  const [showReset, setShowReset] = useState(false);
  const rateList = db.getRateList();

  const saveConfig = () => {
    db.saveConfig(config);
  };

  const handleReset = () => {
    db.reset();
    window.location.reload();
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-rajdhani text-3xl font-bold tracking-wide">UPLOAD DATA</h1>
        <p className="text-muted-foreground text-sm mt-1">Import Excel files to populate the system database</p>
      </div>

      {/* Step 1: Rate list first */}
      <div className="card-military rounded-lg p-5 border border-border space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-mono text-olive font-bold">1</div>
          <h2 className="font-rajdhani font-semibold tracking-wide text-base uppercase">Rate List</h2>
          {rateList.length > 0 && (
            <span className="ml-auto status-badge px-2 py-0.5 bg-success/10 border border-success/30 text-success rounded">
              {rateList.length} items loaded
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Upload first. Required columns: <code className="bg-muted px-1 rounded">Item Name</code>, <code className="bg-muted px-1 rounded">Rate</code> (per 1000g), <code className="bg-muted px-1 rounded">Unit</code>
        </p>
        <FileUploadZone
          label="Rate List Excel"
          description="Excel file with ration items and rates"
          onFile={(file) => parseRateListExcel(file)}
          onDownloadTemplate={downloadRateListTemplate}
          templateLabel="Download Rate List Template"
        />
        {rateList.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full data-table text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-1.5 text-left">#</th>
                  <th className="px-3 py-1.5 text-left">Item</th>
                  <th className="px-3 py-1.5 text-right">Rate/1000g</th>
                  <th className="px-3 py-1.5 text-left">Unit</th>
                </tr>
              </thead>
              <tbody>
                {rateList.map((item, i) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="px-3 py-1.5 font-mono text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-1.5 font-medium">{item.name}</td>
                    <td className="px-3 py-1.5 font-mono text-right text-olive">₹{item.ratePerKg}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Step 2: Soldiers */}
      <div className="card-military rounded-lg p-5 border border-border space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-mono text-olive font-bold">2</div>
          <h2 className="font-rajdhani font-semibold tracking-wide text-base uppercase">Soldier Data</h2>
          {db.getSoldiers().length > 0 && (
            <span className="ml-auto status-badge px-2 py-0.5 bg-success/10 border border-success/30 text-success rounded">
              {db.getSoldiers().length} soldiers loaded
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Required: <code className="bg-muted px-1 rounded">Name</code>, <code className="bg-muted px-1 rounded">Service Number</code>, <code className="bg-muted px-1 rounded">Rank</code>, <code className="bg-muted px-1 rounded">RMA</code> (YES/NO).
          Then one column per ration item (matching rate list names) with gram-per-day entitlement values.
        </p>
        {rateList.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-amber bg-amber/10 border border-amber/20 rounded px-3 py-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Upload rate list first so entitlements map correctly
          </div>
        )}
        <FileUploadZone
          label="Soldier Data Excel"
          description="Excel file with soldier details and entitlements"
          onFile={(file) => parseSoldierExcel(file)}
          onDownloadTemplate={() => downloadSoldierTemplate(rateList)}
          templateLabel="Download Soldier Template"
        />
      </div>

      {/* Mess Config */}
      <div className="card-military rounded-lg p-5 border border-border space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-mono text-olive font-bold">3</div>
          <h2 className="font-rajdhani font-semibold tracking-wide text-base uppercase">Mess Configuration</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-rajdhani tracking-wide uppercase text-muted-foreground">Mess Name</Label>
            <Input
              value={config.messName}
              onChange={(e) => setConfig({ ...config, messName: e.target.value })}
              className="bg-input border-border text-sm h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-rajdhani tracking-wide uppercase text-muted-foreground">Location</Label>
            <Input
              value={config.location}
              onChange={(e) => setConfig({ ...config, location: e.target.value })}
              className="bg-input border-border text-sm h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-rajdhani tracking-wide uppercase text-muted-foreground">Bill Number Prefix</Label>
            <Input
              value={config.billPrefix}
              onChange={(e) => setConfig({ ...config, billPrefix: e.target.value })}
              className="bg-input border-border text-sm h-9"
            />
          </div>
        </div>
        <Button onClick={saveConfig} className="btn-olive h-8 text-xs font-rajdhani tracking-wide">
          SAVE CONFIGURATION
        </Button>
      </div>

      {/* Danger zone */}
      <div className="card-military rounded-lg p-5 border border-danger/20 bg-danger/5 space-y-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-danger" />
          <h2 className="font-rajdhani font-semibold tracking-wide text-sm uppercase text-danger">Danger Zone</h2>
        </div>
        <p className="text-xs text-muted-foreground">Reset all data including soldiers, rate list, entries, and bills. This cannot be undone.</p>
        {!showReset ? (
          <Button size="sm" variant="outline" onClick={() => setShowReset(true)} className="border-danger/30 text-danger hover:bg-danger/10 text-xs h-8 font-rajdhani">
            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> RESET ALL DATA
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-xs text-danger">Are you sure? All data will be lost.</p>
            <Button size="sm" onClick={handleReset} className="bg-danger hover:bg-danger/80 text-xs h-8 font-rajdhani">CONFIRM RESET</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowReset(false)} className="text-xs h-8">Cancel</Button>
          </div>
        )}
      </div>
    </div>
  );
}
