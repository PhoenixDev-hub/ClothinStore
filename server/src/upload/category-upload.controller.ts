import { Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { Admin } from '../common/guards/decorators/admin.decorator';
import { readMultipartFile } from '../common/multipart';
import { UploadResponseDto } from './dto/upload-response.dto';
import { UploadService } from './upload.service';
import { ALLOWED_MIME_TYPES } from './upload.utils';

@ApiTags('upload')
@Controller('admin/categories')
export class CategoryUploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Admin()
  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Envia a imagem de uma categoria',
    description:
      'Aceita JPG, PNG ou WebP, até 5 MB, no campo "file". Retorna a URL pública para usar em "image" da categoria.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({ type: UploadResponseDto })
  @ApiBadRequestResponse({
    description: 'Arquivo ausente ou requisição não multipart',
  })
  @ApiResponse({ status: 413, description: 'Arquivo maior que 5 MB' })
  @ApiResponse({
    status: 415,
    description: 'Formato não suportado (use JPG, PNG ou WebP)',
  })
  async upload(@Req() req: FastifyRequest): Promise<UploadResponseDto> {
    return this.uploadService.uploadImage(
      await readMultipartFile(req, 'file', ALLOWED_MIME_TYPES),
    );
  }
}
