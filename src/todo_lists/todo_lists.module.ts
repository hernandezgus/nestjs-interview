import { Module } from '@nestjs/common';
import { TodoListsController } from './todo_lists.controller';
import { TodoListsService } from './todo_lists.service';
import { TodoSyncService } from './todo_sync.service';
import { ExternalTodoApiService } from './external_todo_api.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodoList } from './todo_list.entity';
import { TodoItem } from './todo_item.entity';
import { TodoSyncConfigService } from './todo_sync_config.service';
import { SyncConfigController } from './sync_config.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TodoList, TodoItem])],
  controllers: [TodoListsController, SyncConfigController],
  providers: [
    TodoListsService,
    TodoSyncService,
    ExternalTodoApiService,
    TodoSyncConfigService,
  ],
  exports: [TodoListsService],
})
export class TodoListsModule {}
