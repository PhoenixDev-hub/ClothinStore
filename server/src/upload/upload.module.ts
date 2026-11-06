import { Module } from '@nestjs/common';
import { CategoryUploadController } from './category-upload.controller';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  controllers: [UploadController, CategoryUploadController],
  providers: [UploadService],
})
export class UploadModule {}
