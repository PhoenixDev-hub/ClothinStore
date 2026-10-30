import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todas as categorias' })
  @ApiOkResponse({ description: 'Categorias com contagem de produtos' })
  findAll() {
    return this.categoriesService.findAll();
  }

  // TODO(auth): proteger com guard de admin.
  @Post()
  @ApiOperation({ summary: 'Cria categoria' })
  @ApiCreatedResponse({ description: 'Categoria criada' })
  @ApiConflictResponse({ description: 'Slug já em uso' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  // TODO(auth): proteger com guard de admin.
  @Put(':id')
  @ApiOperation({ summary: 'Atualiza categoria' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Categoria atualizada' })
  @ApiNotFoundResponse({ description: 'Categoria não encontrada' })
  @ApiConflictResponse({ description: 'Slug já em uso' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  // TODO(auth): proteger com guard de admin.
  @Delete(':id')
  @ApiOperation({ summary: 'Remove categoria' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Categoria removida' })
  @ApiNotFoundResponse({ description: 'Categoria não encontrada' })
  @ApiConflictResponse({ description: 'Categoria possui produtos' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}
