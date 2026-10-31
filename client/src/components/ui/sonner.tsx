import { Toaster as Sonner, type ToasterProps } from "sonner"

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "!rounded-2xl !border-neutral-200 !bg-white !font-sans !text-ink !shadow-lg",
          description: "!text-neutral-500",
          success: "!text-ink",
          error: "!text-ink",
          actionButton: "!bg-wine !text-white",
          cancelButton: "!bg-neutral-100 !text-neutral-600",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
