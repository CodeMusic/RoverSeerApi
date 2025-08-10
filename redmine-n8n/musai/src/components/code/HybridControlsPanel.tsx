import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Shield, EyeOff, UploadCloud, Scissors, FileText, Filter } from 'lucide-react';

export interface HybridControlsPanelProps
{
  enabled?: boolean;
  onChange?: (state: HybridSettingsState) => void;
}

export interface HybridSettingsState
{
  enabled: boolean;
  redactIdentifiers: boolean;
  summarizeLargeDocs: boolean;
  tokenCap: number;
  allowlistDomains: string;
}

export const HybridControlsPanel: React.FC<HybridControlsPanelProps> = ({ enabled = false, onChange }) =>
{
  const [state, setState] = useState<HybridSettingsState>({
    enabled,
    redactIdentifiers: true,
    summarizeLargeDocs: true,
    tokenCap: 4000,
    allowlistDomains: ''
  });

  const update = (partial: Partial<HybridSettingsState>) =>
  {
    const next = { ...state, ...partial };
    setState(next);
    onChange?.(next);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UploadCloud className="w-5 h-5" /> Hybrid Cloud Controls
            </CardTitle>
            <CardDescription>Opt-in, granular, and fully transparent.</CardDescription>
          </div>
          <Badge variant={state.enabled ? 'default' : 'outline'}>{state.enabled ? 'Enabled' : 'Disabled'}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="enabled">Hybrid Assist</Label>
            <p className="text-xs text-muted-foreground">Allow routing specific sub-tasks to cloud models</p>
          </div>
          <Switch id="enabled" checked={state.enabled} onCheckedChange={(v) => update({ enabled: v })} />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><EyeOff className="w-4 h-4" /> Redact identifiers</Label>
            <Switch checked={state.redactIdentifiers} onCheckedChange={(v) => update({ redactIdentifiers: v })} />
            <p className="text-xs text-muted-foreground">Removes emails, tokens, and IDs before sending</p>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Scissors className="w-4 h-4" /> Summarize large docs</Label>
            <Switch checked={state.summarizeLargeDocs} onCheckedChange={(v) => update({ summarizeLargeDocs: v })} />
            <p className="text-xs text-muted-foreground">Condense long PDFs or logs before upload</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tokenCap" className="flex items-center gap-2"><Filter className="w-4 h-4" /> Token cap</Label>
            <Input id="tokenCap" type="number" min={512} max={32000} value={state.tokenCap}
                   onChange={(e) => update({ tokenCap: Number(e.target.value) })} />
            <p className="text-xs text-muted-foreground">Maximum tokens per cloud request</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="allowlist" className="flex items-center gap-2"><FileText className="w-4 h-4" /> Domain allowlist</Label>
            <Input id="allowlist" placeholder="example.com, docs.org" value={state.allowlistDomains}
                   onChange={(e) => update({ allowlistDomains: e.target.value })} />
            <p className="text-xs text-muted-foreground">Comma-separated list of domains allowed for retrieval</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-4 h-4" /> Local-first. Nothing is sent unless you opt in here or per-task.
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setState({ enabled: false, redactIdentifiers: true, summarizeLargeDocs: true, tokenCap: 4000, allowlistDomains: '' })}>Reset</Button>
          <Button onClick={() => onChange?.(state)}>Save</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default HybridControlsPanel;


