import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Admin } from '../common/guards/decorators/admin.decorator';
import { QueryProductsDto } from './dto/query-products.dto';
import { ProductsService } from './products.service';

@ApiTags('admin-products')
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Admin()
  @Get()
  @ApiOperation({
    summary: 'Lista produtos para o admin',
    description:
      'Inclui DRAFT e ARCHIVED. Aceita os mesmos filtros da listagem pública, paginação e status.',
  })
  @ApiOkResponse({ description: 'Lista paginada com categoria e variantes' })
  findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAllAdmin(query);
  }

  @Admin()
  @Get(':id')
  @ApiOperation({ summary: 'Busca produto por id para o admin' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Produto encontrado, qualquer status' })
  @ApiNotFoundResponse({ description: 'Produto não encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOneAdmin(id);
  }
}
