import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CartItemDto {
  @ApiProperty({ example: 'CAM-BAS-M-BRANCO' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}
