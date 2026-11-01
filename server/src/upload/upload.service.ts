import {
  BadGatewayException,
  Injectable,
  Logger,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createClient,
  type WebSocketLikeConstructor,
} from '@supabase/supabase-js';
import WebSocket from 'ws';
import { randomUUID } from 'node:crypto';
import { UploadResponseDto } from './dto/upload-response.dto';
import {
  ALLOWED_MIME_TYPES,
  BUCKET,
  detectImageType,
  MAX_IMAGE_BYTES,
} from './upload.utils';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly client: ReturnType<typeof createClient>;
  private bucketReady?: Promise<void>;

  constructor(config: ConfigService) {
    this.client = createClient(
      config.getOrThrow<string>('SUPABASE_URL'),
      config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
      {
        auth: { persistSession: false, autoRefreshToken: false },
        // Node 20 não tem WebSocket global; evita o erro do RealtimeClient
        // na criação do client, mesmo usando apenas o Storage.
        realtime: {
          transport: WebSocket as unknown as WebSocketLikeConstructor,
        },
      },
    );
  }

  async uploadImage(buffer: Buffer): Promise<UploadResponseDto> {
    const type = detectImageType(buffer);
    if (!type) {
      throw new UnsupportedMediaTypeException(
        'Apenas imagens JPG, PNG ou WebP são aceitas',
      );
    }

    await this.ensureBucket();

    const now = new Date();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const path = `${now.getUTCFullYear()}/${month}/${randomUUID()}.${type.ext}`;

    const { error } = await this.client.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: type.mime,
        cacheControl: '31536000',
        upsert: false,
      });
    if (error) {
      this.logger.error(`Falha no upload: ${error.message}`);
      throw new BadGatewayException('Falha ao enviar a imagem para o storage');
    }

    const { data } = this.client.storage.from(BUCKET).getPublicUrl(path);
    return { url: data.publicUrl, path };
  }

  /** Garante o bucket uma vez por processo; se falhar, tenta de novo na próxima chamada. */
  private ensureBucket(): Promise<void> {
    this.bucketReady ??= this.createBucketIfMissing().catch((e) => {
      this.bucketReady = undefined;
      throw e;
    });
    return this.bucketReady;
  }

  private async createBucketIfMissing(): Promise<void> {
    const { data } = await this.client.storage.getBucket(BUCKET);
    if (data) return;

    const { error } = await this.client.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_IMAGE_BYTES,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
    });
    if (error && !/already exists/i.test(error.message)) {
      this.logger.error(`Falha ao criar bucket: ${error.message}`);
      throw new BadGatewayException('Storage indisponível');
    }
  }
}
