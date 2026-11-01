import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({
    description: 'URL pública da imagem (use em "images" do produto)',
    example:
      'https://xxxx.supabase.co/storage/v1/object/public/product-images/2026/10/0b6f...e1.jpg',
  })
  url: string;

  @ApiProperty({ example: '2026/10/0b6f...e1.jpg' })
  path: string;
}
