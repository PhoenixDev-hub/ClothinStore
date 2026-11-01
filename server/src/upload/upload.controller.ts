import {
  BadRequestException,
  Controller,
  PayloadTooLargeException,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { Admin } from '../common/guards/decorators/admin.decorator';
import { UploadResponseDto } from './dto/upload-response.dto';
import { UploadService } from './upload.service';
import { MAX_IMAGE_BYTES } from './upload.utils';

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Admin()
  @Post()
  @ApiOperation({
    summary: 'Envia uma imagem de produto',
    description:
      'Aceita JPG, PNG ou WebP, até 5 MB, no campo "file". Retorna a URL pública para usar em "images" do produto.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiCreatedResponse({ type: UploadResponseDto })
  @ApiBadRequestResponse({
    description: 'Arquivo ausente ou requisição não multipart',
  })
  @ApiResponse({ status: 413, description: 'Arquivo maior que 5 MB' })
  @ApiResponse({
    status: 415,
    description: 'Formato não suportado (use JPG, PNG ou WebP)',
  })
  async upload(@Req() req: FastifyRequest): Promise<UploadResponseDto> {
    if (!req.isMultipart()) {
      throw new BadRequestException(
        'Envie multipart/form-data com o campo "file"',
      );
    }

    const part = await req.file();
    if (!part || part.fieldname !== 'file') {
      throw new BadRequestException('Campo "file" é obrigatório');
    }

    let buffer: Buffer;
    try {
      buffer = await part.toBuffer();
    } catch (e) {
      if ((e as { code?: string }).code === 'FST_REQ_FILE_TOO_LARGE') {
        throw new PayloadTooLargeException(
          `Arquivo excede ${MAX_IMAGE_BYTES / 1024 / 1024} MB`,
        );
      }
      throw e;
    }
    if (part.file.truncated) {
      throw new PayloadTooLargeException(
        `Arquivo excede ${MAX_IMAGE_BYTES / 1024 / 1024} MB`,
      );
    }

    return this.uploadService.uploadImage(buffer);
  }
}
