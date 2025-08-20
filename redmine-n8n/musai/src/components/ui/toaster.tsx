import { Toaster as Sonner } from "sonner";

export function Toaster(): JSX.Element {
  return (
    <Sonner
      position="bottom-right"
      richColors
      closeButton
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            // Base styling + variant colors via data attributes
            "group toast shadow-lg border text-white " +
            "data-[type=default]:bg-violet-600 data-[type=default]:border-violet-700 " +
            "data-[type=success]:bg-green-600 data-[type=success]:border-green-700 " +
            "data-[type=info]:bg-blue-600 data-[type=info]:border-blue-700 " +
            "data-[type=error]:bg-red-600 data-[type=error]:border-red-700",
          description: "opacity-90",
          actionButton: "bg-white/20 text-white hover:bg-white/30",
          cancelButton: "bg-white/10 text-white/90 hover:bg-white/20",
        },
      }}
    />
  );
}
