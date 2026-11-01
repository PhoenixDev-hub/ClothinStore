import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ enum: ['ok', 'degraded'] })
  status: 'ok' | 'degraded';

  @ApiProperty({ description: 'Postgres respondeu a SELECT 1' })
  database: boolean;

  @ApiProperty({ description: 'Redis respondeu a PING' })
  redis: boolean;
}
