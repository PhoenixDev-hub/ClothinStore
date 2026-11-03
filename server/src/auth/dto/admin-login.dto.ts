import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({ description: 'Chave admin configurada no servidor' })
  @IsString()
  @IsNotEmpty()
  apiKey: string;
}
