import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { CartQuoteDto } from './dto/cart-quote.dto';
import {
  CartQuoteResponseDto,
  WhatsAppResponseDto,
} from './dto/cart-responses.dto';

@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('quote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cota o carrinho com preço e estoque reais',
    description:
      'Preços vêm sempre do banco. Itens indisponíveis ou sem estoque suficiente voltam com available=false e reason, sem afetar os demais. Valores em centavos.',
  })
  @ApiOkResponse({ type: CartQuoteResponseDto })
  @ApiBadRequestResponse({ description: 'Payload inválido' })
  quote(@Body() dto: CartQuoteDto) {
    return this.cartService.quote(dto.items);
  }

  @Post('whatsapp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Gera a mensagem e o link do WhatsApp com os itens disponíveis',
    description:
      'Recalcula a cotação no servidor e inclui apenas itens disponíveis. Usa WHATSAPP_NUMBER.',
  })
  @ApiOkResponse({ type: WhatsAppResponseDto })
  @ApiBadRequestResponse({
    description: 'Payload inválido ou nenhum item disponível',
  })
  async whatsapp(@Body() dto: CartQuoteDto) {
    const quote = await this.cartService.quote(dto.items);
    return this.cartService.generateWhatsAppMessage(quote);
  }
}
