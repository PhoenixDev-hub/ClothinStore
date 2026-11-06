import { ApiProperty } from '@nestjs/swagger';

export class ImportErrorDto {
  @ApiProperty({
    description: 'Linha do CSV (1-based, contando o cabeçalho)',
    example: 3,
  })
  linha: number;

  @ApiProperty({ example: 'Categoria "Inexistente" não encontrada' })
  motivo: string;
}

export class ImportProductsResponseDto {
  @ApiProperty({ example: 12 })
  criados: number;

  @ApiProperty({ type: [ImportErrorDto] })
  erros: ImportErrorDto[];
}
