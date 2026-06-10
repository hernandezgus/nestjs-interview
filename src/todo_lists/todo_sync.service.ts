import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExternalTodoApiService } from './external_todo_api.service';
import { TodoItem } from './todo_item.entity';
import { TodoList } from './todo_list.entity';

@Injectable()
export class TodoSyncService {
  private readonly logger = new Logger(TodoSyncService.name);

  constructor(
    private readonly externalTodoApiService: ExternalTodoApiService,
    @InjectRepository(TodoList)
    private readonly todoListRepository: Repository<TodoList>,
    @InjectRepository(TodoItem)
    private readonly todoItemRepository: Repository<TodoItem>,
  ) {}

  @Cron('*/5 * * * *')
  async handleCron(): Promise<void> {
    this.logger.log('Automatic sync triggered');
    await this.syncFromExternal();
  }

  async syncFromExternal(): Promise<{
    success: boolean;
    created: number;
    failed: number;
    message?: string;
  }> {
    this.logger.log('Starting sync from external Todo API');

    let externalLists: any[] = [];
    try {
      externalLists = await this.externalTodoApiService.getTodoLists();
    } catch (error) {
      this.logger.error(
        'Failed to fetch external todo lists',
        error instanceof Error ? error.stack : String(error),
      );
      return {
        success: false,
        created: 0,
        failed: 0,
        message: 'External API unavailable',
      };
    }

    const localLists = await this.todoListRepository.find({ relations: ['items'] });
    const existingNames = new Set(localLists.map((list) => list.name));
    let createdCount = 0;
    let failedCount = 0;

    for (const externalList of externalLists ?? []) {
      if (!externalList || typeof externalList.name !== 'string') {
        continue;
      }

      if (existingNames.has(externalList.name)) {
        continue;
      }

      const todoList = this.todoListRepository.create({
        name: externalList.name,
        items: Array.isArray(externalList.items)
          ? externalList.items.map((item: any) => {
              const todoItem = new TodoItem();
              todoItem.name = item.description ?? '';
              todoItem.completed = item.completed ?? false;
              return todoItem;
            })
          : [],
      });

      const created = await this.tryCreateListWithRetry(todoList, externalList.name);
      if (created) {
        createdCount += 1;
      } else {
        failedCount += 1;
      }
    }

    this.logger.log(
      `Sync completed: created=${createdCount}, failed=${failedCount}`,
    );

    return {
      success: failedCount === 0,
      created: createdCount,
      failed: failedCount,
    };
  }

  private async tryCreateListWithRetry(
    todoList: TodoList,
    listName: string,
  ): Promise<boolean> {
    try {
      await this.todoListRepository.save(todoList);
      return true;
    } catch (error) {
      this.logger.warn(
        `First attempt failed for list ${listName}, retrying...`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    try {
      await this.todoListRepository.save(todoList);
      return true;
    } catch (error) {
      this.logger.error(
        `Second attempt failed for list ${listName}`,
        error instanceof Error ? error.stack : String(error),
      );
      return false;
    }
  }
}
