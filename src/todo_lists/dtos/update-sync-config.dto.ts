import { IsBoolean } from 'class-validator';

export class UpdateSyncConfigDto {
  @IsBoolean()
  enabled!: boolean;
}
