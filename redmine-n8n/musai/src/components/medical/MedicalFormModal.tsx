import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export interface MedicalFormSection
{
  title: string;
  content: React.ReactNode;
}

export interface MedicalFormModalProps
{
  triggerLabel: string;
  title: string;
  subtitle?: string;
  patientMeta: Record<string, string>;
  sections: MedicalFormSection[];
  maxWidthClass?: string; // e.g., 'sm:max-w-[860px]'
  // If provided, one variant will be selected at random each open
  variants?: Array<{
    patientMeta: Record<string, string>;
    sections: MedicalFormSection[];
  }>;
}

export const MedicalFormModal: React.FC<MedicalFormModalProps> = ({
  triggerLabel,
  title,
  subtitle,
  patientMeta,
  sections,
  maxWidthClass = 'sm:max-w-[860px]'
  , variants
}) =>
{
  const [open, setOpen] = React.useState(false);
  const [selectedMeta, setSelectedMeta] = React.useState<Record<string, string>>(patientMeta);
  const [selectedSections, setSelectedSections] = React.useState<MedicalFormSection[]>(sections);
  const printRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    if (variants && variants.length > 0)
    {
      const pick = variants[Math.floor(Math.random() * variants.length)];
      setSelectedMeta(pick.patientMeta);
      setSelectedSections(pick.sections);
    }
    else
    {
      setSelectedMeta(patientMeta);
      setSelectedSections(sections);
    }
  }, [open, variants, patientMeta, sections]);

  const handlePrint = (): void =>
  {
    try
    {
      const container = printRef.current;
      if (!container)
      {
        window.print();
        return;
      }

      const sectionEls = Array.from(container.querySelectorAll('.mf-section')) as HTMLElement[];
      const sectionsHtml = sectionEls.map((el) => {
        const title = el.getAttribute('data-title') || '';
        const contentEl = el.querySelector('.mf-content') as HTMLElement | null;
        const contentHtml = contentEl ? contentEl.innerHTML : '';
        return `<div class="section"><div class="section-title">${title}</div><div class="section-content">${contentHtml}</div></div>`;
      }).join('');

      const metaHtml = Object.entries(selectedMeta).map(([k, v]) => `
        <div class="cell"><div class="label">${k}</div><div class="value">${v}</div></div>
      `).join('');

      const w = window.open('', '_blank', 'width=860,height=1100');
      if (!w) { window.print(); return; }
      w.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif; padding: 24px; color: #111; }
              .band { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ccc; padding-bottom: 8px; margin-bottom: 16px; }
              .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; font-size: 12px; }
              .cell { display: flex; border: 1px solid #ddd; }
              .label { background: #f5f5f5; width: 120px; padding: 6px; font-weight: 600; }
              .value { padding: 6px; flex: 1; }
              .section { border: 1px solid #ddd; margin-top: 12px; }
              .section-title { background: #f7f7f7; padding: 8px 10px; font-weight: 600; font-size: 14px; border-bottom: 1px solid #ddd; }
              .section-content { padding: 10px 12px; font-size: 13px; }
              ul { margin: 6px 0 0 18px; }
              ol { margin: 6px 0 0 18px; }
              @media print { body { padding: 12mm; } }
            </style>
          </head>
          <body>
            <div class="band">
              <div>
                <div style="font-weight:700;">MedicalMusai</div>
                <div style="font-size:12px;color:#666">Patient‑as‑Pilot — For clinical review</div>
              </div>
              <div style="font-size:12px;color:#666">${new Date().toLocaleDateString()}</div>
            </div>
            <div class="grid">${metaHtml}</div>
            ${sectionsHtml}
          </body>
        </html>
      `);
      w.document.close();
      w.focus();
      w.print();
    }
    catch
    {
      window.print();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className={maxWidthClass}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {subtitle && (<DialogDescription>{subtitle}</DialogDescription>)}
        </DialogHeader>

        <div ref={printRef} className="bg-white text-black dark:text-foreground dark:bg-card border rounded-md">
          {/* Header band */}
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <div className="text-base font-semibold">MedicalMusai</div>
                <div className="text-xs text-muted-foreground">Patient‑as‑Pilot — For clinical review</div>
              </div>
            <Button variant="outline" size="sm" onClick={handlePrint}>Print</Button>
          </div>

          {/* Patient meta grid */}
          <div className="px-6 py-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {Object.entries(selectedMeta).map(([label, value]) => (
                <div key={label} className="flex border rounded-sm overflow-hidden">
                  <div className="bg-muted/50 px-2 py-1 w-28 shrink-0 font-medium">{label}</div>
                  <div className="px-2 py-1 flex-1">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <Separator className="my-2" />

          {/* Sections */}
          <div className="px-6 pb-6 space-y-4">
            {selectedSections.map((section) => (
              <div key={section.title} className="border rounded-md mf-section" data-title={section.title}>
                <div className="px-3 py-2 border-b bg-muted/30 font-medium text-sm">{section.title}</div>
                <div className="px-4 py-3 text-sm text-muted-foreground mf-content">
                  {section.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MedicalFormModal;


