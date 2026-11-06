import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { MAX_IMAGE_BYTES } from '../upload/upload.utils';

/** Lê um único arquivo multipart do campo informado; erro claro se ausente ou grande demais. */
export async function readMultipartFile(
  req: FastifyRequest,
  field = 'file',
): Promise<Buffer> {
  if (!req.isMultipart()) {
    throw new BadRequestException(
      `Envie multipart/form-data com o campo "${field}"`,
    );
  }

  const part = await req.file();
  if (!part || part.fieldname !== field) {
    throw new BadRequestException(`Campo "${field}" é obrigatório`);
  }

  try {
    const buffer = await part.toBuffer();
    if (part.file.truncated) throw new PayloadTooLargeException();
    return buffer;
  } catch (e) {
    if (
      (e as { code?: string }).code === 'FST_REQ_FILE_TOO_LARGE' ||
      e instanceof PayloadTooLargeException
    ) {
      throw new PayloadTooLargeException(
        `Arquivo excede ${MAX_IMAGE_BYTES / 1024 / 1024} MB`,
      );
    }
    throw e;
  }
}
