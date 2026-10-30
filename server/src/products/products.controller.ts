import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista produtos paginados',
    description:
      'Filtros: category (slug), size, color, inStock, minPrice, maxPrice (centavos), search e status. Cada item traz totalStock e inStock.',
  })
  @ApiOkResponse({ description: 'Lista paginada com categoria e variantes' })
  findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Busca produto ativo pelo slug' })
  @ApiParam({ name: 'slug', example: 'camiseta-basica-algodao' })
  @ApiOkResponse({ description: 'Produto encontrado' })
  @ApiNotFoundResponse({ description: 'Produto não encontrado' })
  findOne(@Param('slug') slug: string) {
    return this.productsService.findOne(slug);
  }

  // TODO(auth): proteger com guard de admin.
  @Post()
  @ApiOperation({ summary: 'Cria produto (com variantes e estoque)' })
  @ApiCreatedResponse({ description: 'Produto criado' })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou categoryId inexistente',
  })
  @ApiConflictResponse({ description: 'Slug ou SKU já em uso' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  // TODO(auth): proteger com guard de admin.
  @Put(':id')
  @ApiOperation({
    summary: 'Atualiza produto',
    description: 'Se "variants" for enviado, substitui todas as variantes.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Produto atualizado' })
  @ApiNotFoundResponse({ description: 'Produto não encontrado' })
  @ApiConflictResponse({ description: 'Slug ou SKU já em uso' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  // TODO(auth): proteger com guard de admin.
  @Delete(':id')
  @ApiOperation({ summary: 'Remove produto e variantes' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Produto removido' })
  @ApiNotFoundResponse({ description: 'Produto não encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
