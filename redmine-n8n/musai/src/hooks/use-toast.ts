import { toast as sonnerToast } from "sonner";

type MusaiToastVariant = "default" | "destructive" | "success" | "info";

interface MusaiToastOptions {
  id?: string | number;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: MusaiToastVariant;
  duration?: number;
}

function toast(options: MusaiToastOptions)
{
  const { title, description, variant = "default", duration, id } = options || {};
  const message = typeof title === "string" ? title : (typeof description === "string" ? description : "");

  switch (variant)
  {
    case "destructive":
      return sonnerToast.error(message, { description: typeof description === "string" ? description : undefined, duration, id });
    case "success":
      return sonnerToast.success(message, { description: typeof description === "string" ? description : undefined, duration, id });
    case "info":
      return sonnerToast.info(message, { description: typeof description === "string" ? description : undefined, duration, id });
    default:
      return sonnerToast(message, { description: typeof description === "string" ? description : undefined, duration, id });
  }
}

function useToast()
{
  return {
    toast,
    dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId),
  } as const;
}

export { useToast, toast };
