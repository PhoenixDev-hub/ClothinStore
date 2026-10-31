import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProductStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CartItemDto } from './dto/cart-item.dto';
import {
  CartQuoteResponseDto,
  QuoteItemDto,
  UnavailableReason,
  WhatsAppResponseDto,
} from './dto/cart-responses.dto';

const brl = (cents: number) =>
  (cents / 100)
    .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    .replace(/\u00A0/g, ' ');

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async quote(items: CartItemDto[]): Promise<CartQuoteResponseDto> {
    const requested = new Map<string, number>();
    for (const { sku, quantity } of items) {
      const key = sku.trim();
      requested.set(key, (requested.get(key) ?? 0) + quantity);
    }

    const variants = await this.prisma.variant.findMany({
      where: { sku: { in: [...requested.keys()] } },
      include: {
        product: { select: { name: true, price: true, status: true } },
      },
    });
    const bySku = new Map(variants.map((v) => [v.sku, v]));

    const result: QuoteItemDto[] = [...requested].map(([sku, quantity]) => {
      const variant = bySku.get(sku);

      if (!variant) {
        return {
          sku,
          productName: null,
          variantSize: null,
          variantColor: null,
          unitPrice: 0,
          quantity,
          subtotal: 0,
          available: false,
          maxStock: 0,
          reason: 'NOT_FOUND',
        };
      }

      const sellable =
        variant.available && variant.product.status === ProductStatus.ACTIVE;
      const unitPrice = variant.price ?? variant.product.price;

      let reason: UnavailableReason | undefined;
      if (!sellable) reason = 'UNAVAILABLE';
      else if (variant.stock === 0) reason = 'OUT_OF_STOCK';
      else if (quantity > variant.stock) reason = 'INSUFFICIENT_STOCK';

      const available = reason === undefined;

      return {
        sku,
        productName: variant.product.name,
        variantSize: variant.size,
        variantColor: variant.color,
        unitPrice,
        quantity,
        subtotal: available ? unitPrice * quantity : 0,
        available,
        maxStock: sellable ? variant.stock : 0,
        ...(reason ? { reason } : {}),
      };
    });

    const availableItems = result.filter((i) => i.available);
    const unavailableItems = result.filter((i) => !i.available);
    const subtotal = availableItems.reduce((sum, i) => sum + i.subtotal, 0);

    return {
      items: result,
      availableItems,
      unavailableItems,
      subtotal,
      total: subtotal,
    };
  }

  generateWhatsAppMessage(quote: CartQuoteResponseDto): WhatsAppResponseDto {
    const number = (this.config.get<string>('WHATSAPP_NUMBER') ?? '').replace(
      /\D/g,
      '',
    );
    if (!number) {
      throw new InternalServerErrorException('WHATSAPP_NUMBER não configurado');
    }
    if (quote.availableItems.length === 0) {
      throw new BadRequestException('Nenhum item disponível para compra');
    }

    const lines = quote.availableItems.map(
      (i) =>
        `- ${i.quantity}x ${i.productName} (${i.variantSize}, ${i.variantColor}) — ${brl(i.subtotal)}`,
    );
    const message = [
      'Olá! Quero comprar:',
      ...lines,
      '',
      `Total: ${brl(quote.total)}`,
    ].join('\n');

    return {
      message,
      whatsappUrl: `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
    };
  }
}
