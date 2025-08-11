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
    window.print();
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

        <div className="bg-white text-black dark:text-foreground dark:bg-card border rounded-md">
          {/* Header band */}
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div>
              <div className="text-base font-semibold">Co‑Pilot Health</div>
              <div className="text-xs text-muted-foreground">Confidential — For clinical review</div>
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
              <div key={section.title} className="border rounded-md">
                <div className="px-3 py-2 border-b bg-muted/30 font-medium text-sm">{section.title}</div>
                <div className="px-4 py-3 text-sm text-muted-foreground">
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


