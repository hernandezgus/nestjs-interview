import {
  Body,
  Controller,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TodoSyncService } from './todo_sync.service';
import { UpdateSyncConfigDto } from './dtos/update-sync-config.dto';

@Controller('api/config')
@UseGuards(JwtAuthGuard)
export class SyncConfigController {
  constructor(private readonly todoSyncService: TodoSyncService) {}

  @Put('sync')
  update(@Body() dto: UpdateSyncConfigDto): { autoSyncEnabled: boolean } {
    const autoSyncEnabled = this.todoSyncService.setAutoSyncEnabled(dto.enabled);
    return { autoSyncEnabled };
  }
}
