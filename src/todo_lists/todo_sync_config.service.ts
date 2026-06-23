import { Injectable } from '@nestjs/common';

@Injectable()
export class TodoSyncConfigService {
  private autoSyncEnabled =
    (process.env.AUTO_SYNC_ENABLED ?? 'false').toLowerCase() === 'true';

  isEnabled(): boolean {
    return this.autoSyncEnabled;
  }

  setEnabled(enabled: boolean): boolean {
    this.autoSyncEnabled = enabled;
    return this.autoSyncEnabled;
  }
}
