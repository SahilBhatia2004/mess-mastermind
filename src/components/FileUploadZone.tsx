import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  label: string;
  description: string;
  accept?: string;
  onFile: (file: File) => Promise<{ success: boolean; message: string }>;
  onDownloadTemplate?: () => void;
  templateLabel?: string;
}

export default function FileUploadZone({
  label, description, accept = '.xlsx,.xls,.csv',
  onFile, onDownloadTemplate, templateLabel
}: FileUploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setLoading(true);
    setResult(null);
    const res = await onFile(file);
    setResult(res);
    setLoading(false);
  }, [onFile]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer group',
          dragging
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-primary/60 hover:bg-primary/5',
          loading && 'opacity-60 pointer-events-none'
        )}
        onClick={() => document.getElementById(`file-input-${label}`)?.click()}
      >
        <input
          id={`file-input-${label}`}
          type="file"
          accept={accept}
          className="hidden"
          onChange={onInputChange}
        />
        <div className="flex flex-col items-center gap-3">
          {loading ? (
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          ) : (
            <div className={cn(
              'w-12 h-12 rounded-lg flex items-center justify-center transition-colors',
              dragging ? 'bg-primary/20' : 'bg-secondary group-hover:bg-primary/10'
            )}>
              <FileSpreadsheet className={cn('w-6 h-6', dragging ? 'text-olive' : 'text-muted-foreground group-hover:text-olive')} />
            </div>
          )}
          <div>
            <p className="font-rajdhani font-semibold text-sm tracking-wide text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Upload className="w-3 h-3" />
            <span>Drop file here or click to browse</span>
          </div>
        </div>
      </div>

      {result && (
        <div className={cn(
          'flex items-start gap-2 px-3 py-2 rounded border text-sm animate-fade-in',
          result.success
            ? 'bg-success/10 border-success/30 text-success'
            : 'bg-danger/10 border-danger/30 text-danger'
        )}>
          {result.success
            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          <span>{result.message}</span>
        </div>
      )}

      {onDownloadTemplate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDownloadTemplate}
          className="text-xs text-muted-foreground hover:text-olive gap-1.5"
        >
          <Download className="w-3 h-3" />
          {templateLabel ?? 'Download Template'}
        </Button>
      )}
    </div>
  );
}
