import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const UNAVAILABLE_REASONS = [
  'NOT_FOUND',
  'UNAVAILABLE',
  'OUT_OF_STOCK',
  'INSUFFICIENT_STOCK',
] as const;
export type UnavailableReason = (typeof UNAVAILABLE_REASONS)[number];

export class QuoteItemDto {
  @ApiProperty({ example: 'CAM-BAS-M-BRANCO' })
  sku: string;

  @ApiProperty({ example: 'Camiseta Básica Algodão', nullable: true })
  productName: string | null;

  @ApiProperty({ example: 'M', nullable: true })
  variantSize: string | null;

  @ApiProperty({ example: 'Branco', nullable: true })
  variantColor: string | null;

  @ApiProperty({
    description: 'Preço unitário em centavos (do banco)',
    example: 5990,
  })
  unitPrice: number;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({
    description:
      'unitPrice × quantity em centavos; 0 se o item não está disponível',
    example: 11980,
  })
  subtotal: number;

  @ApiProperty({ example: true })
  available: boolean;

  @ApiProperty({
    description:
      'Estoque que pode ser comprado agora (0 se a variante/produto está indisponível)',
    example: 42,
  })
  maxStock: number;

  @ApiPropertyOptional({ enum: UNAVAILABLE_REASONS })
  reason?: UnavailableReason;
}

export class CartQuoteResponseDto {
  @ApiProperty({
    type: [QuoteItemDto],
    description: 'Todos os itens, na ordem enviada',
  })
  items: QuoteItemDto[];

  @ApiProperty({ type: [QuoteItemDto] })
  availableItems: QuoteItemDto[];

  @ApiProperty({ type: [QuoteItemDto] })
  unavailableItems: QuoteItemDto[];

  @ApiProperty({
    description: 'Soma dos itens disponíveis, em centavos',
    example: 30970,
  })
  subtotal: number;

  @ApiProperty({
    description: 'Igual ao subtotal (ainda sem frete/desconto)',
    example: 30970,
  })
  total: number;
}

export class WhatsAppResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty({ example: 'https://wa.me/5585999999999?text=Ol%C3%A1!...' })
  whatsappUrl: string;
}
