import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { ApiError, cartApi } from "@/lib/api";
import { isWhatsAppUrl, UNAVAILABLE_LABEL } from "@/lib/cart";
import { useCart } from "@/store/cart";
import { Button } from "@/components/ui/button";

interface Props {
  className?: string;
  disabled?: boolean;
}

export function WhatsAppButton({ className, disabled }: Props) {
  const items = useCart((s) => s.items);
  const setMaxStock = useCart((s) => s.setMaxStock);
  const clear = useCart((s) => s.clear);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const quote = await cartApi.quote(items);
      quote.items.forEach((item) => setMaxStock(item.sku, item.maxStock));

      if (quote.unavailableItems.length > 0) {
        const detail = quote.unavailableItems
          .map((item) => `${item.productName ?? item.sku}: ${item.reason ? UNAVAILABLE_LABEL[item.reason] : "indisponível"}`)
          .join(" · ");
        toast.error("Revise os itens do carrinho", { description: detail });
        return;
      }

      const order = await cartApi.whatsapp(items);
      if (!isWhatsAppUrl(order.whatsappUrl)) {
        toast.error("A loja retornou um link de WhatsApp inválido.");
        return;
      }

      const win = window.open(order.whatsappUrl, "_blank");
      if (!win) {
        toast.error("Não foi possível abrir o WhatsApp", {
          description: "Libere pop-ups neste site e clique novamente. Seu carrinho foi mantido.",
        });
        return;
      }
      try {
        win.opener = null;
      } catch {
        // Cross-origin opener hardening is best-effort.
      }
      clear();
      toast.success("Pedido enviado! Continue a conversa no WhatsApp.");
    } catch (error) {
      const message =
        error instanceof ApiError && error.status === 0
          ? "Sem conexão com a loja. Verifique sua internet e tente novamente."
          : "Não foi possível gerar o pedido agora. Tente novamente em instantes.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="whatsapp"
      size="lg"
      className={className}
      onClick={submit}
      disabled={disabled || loading || items.length === 0}
      aria-busy={loading}
    >
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : (
        <MessageCircle />
      )}
      {loading ? "Validando pedido..." : "Enviar pedido pelo WhatsApp"}
    </Button>
  );
}
