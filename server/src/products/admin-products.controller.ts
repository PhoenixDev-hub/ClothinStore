import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { Admin } from '../common/guards/decorators/admin.decorator';
import { readMultipartFile } from '../common/multipart';
import { ImportProductsResponseDto } from './dto/import-products-response.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { ProductImportService } from './product-import.service';
import { ProductsService } from './products.service';

@ApiTags('admin-products')
@Controller('admin/products')
export class AdminProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly importService: ProductImportService,
  ) {}

  @Admin()
  @Post('import')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Importa produtos a partir de um CSV',
    description:
      'Recebe multipart/form-data com o campo "file". Colunas obrigatórias: nome, descrição, preço, categoria, tamanho, cor, estoque, imagem. Cada linha válida cria um produto ACTIVE com uma variante. Linhas inválidas voltam em "erros" sem interromper as demais.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({ type: ImportProductsResponseDto })
  @ApiBadRequestResponse({
    description: 'CSV ausente, vazio ou sem as colunas obrigatórias',
  })
  async import(@Req() req: FastifyRequest): Promise<ImportProductsResponseDto> {
    const csv = (await readMultipartFile(req)).toString('utf8');
    return this.importService.import(csv);
  }

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
