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
    createdLocal: number;
    createdExternal: number;
    updatedExternal: number;
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
        createdLocal: 0,
        createdExternal: 0,
        updatedExternal: 0,
        failed: 0,
        message: 'External API unavailable',
      };
    }

    const localLists = await this.todoListRepository.find({ relations: ['items'] });
    const existingNames = new Set(localLists.map((list) => list.name));
    let createdLocal = 0;
    let createdExternal = 0;
    let updatedExternal = 0;
    let failed = 0;

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

      const created = await this.trySaveWithRetry(
        () => this.todoListRepository.save(todoList),
        `local list ${externalList.name}`,
      );
      if (created) {
        createdLocal += 1;
      } else {
        failed += 1;
      }
    }

    this.logger.log('Starting local -> external sync phase');

    for (const localList of localLists) {
      const externalList = externalLists.find(
        (candidate) => candidate.name === localList.name,
      );

      let targetExternalList = externalList;

      if (!targetExternalList) {
        const created = await this.tryExecuteWithRetry(
          () =>
            this.externalTodoApiService.createTodoList({
              name: localList.name,
            }),
          `create external list ${localList.name}`,
        );
        if (created) {
          createdExternal += 1;
          targetExternalList = created;
          externalLists.push(targetExternalList);
        } else {
          failed += 1;
          continue;
        }
      }

      if (
        targetExternalList.id &&
        targetExternalList.name !== localList.name
      ) {
        const updated = await this.tryExecuteWithRetry(
          () =>
            this.externalTodoApiService.updateTodoList(targetExternalList.id, {
              name: localList.name,
            }),
          `update external list ${targetExternalList.id}`,
        );
        if (updated) {
          updatedExternal += 1;
          targetExternalList = updated;
        } else {
          failed += 1;
        }
      }

      const externalItems: any[] = Array.isArray(targetExternalList.items)
        ? targetExternalList.items
        : [];
      let processedItems = 0;

      for (const localItem of localList.items ?? []) {
        const matchingExternalItem = externalItems.find(
          (externalItem) => externalItem.description === localItem.name,
        );

        if (!matchingExternalItem) {
          const created = await this.tryExecuteWithRetry(
            () =>
              this.externalTodoApiService.createTodoItem(targetExternalList.id, {
                description: localItem.name,
                completed: localItem.completed,
              }),
            `create external item ${localItem.name} for list ${localList.name}`,
          );
          if (created) {
            createdExternal += 1;
            externalItems.push(created);
          } else {
            failed += 1;
          }
        } else if (
          matchingExternalItem.completed !== localItem.completed ||
          matchingExternalItem.description !== localItem.name
        ) {
          const updated = await this.tryExecuteWithRetry(
            () =>
              this.externalTodoApiService.updateTodoItem(
                targetExternalList.id,
                matchingExternalItem.id,
                {
                  description: localItem.name,
                  completed: localItem.completed,
                },
              ),
            `update external item ${matchingExternalItem.id} for list ${localList.name}`,
          );
          if (updated) {
            updatedExternal += 1;
          } else {
            failed += 1;
          }
        }

        processedItems += 1;
      }

      this.logger.log(
        `Processed ${processedItems} items for local list ${localList.name}`,
      );
    }

    this.logger.log(
      `Sync completed: createdLocal=${createdLocal}, createdExternal=${createdExternal}, updatedExternal=${updatedExternal}, failed=${failed}`,
    );

    return {
      success: failed === 0,
      createdLocal,
      createdExternal,
      updatedExternal,
      failed,
    };
  }

  private async trySaveWithRetry(
    operation: () => Promise<any>,
    operationName: string,
  ): Promise<boolean> {
    try {
      await operation();
      return true;
    } catch (error) {
      this.logger.warn(
        `First attempt failed for ${operationName}, retrying...`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    try {
      await operation();
      return true;
    } catch (error) {
      this.logger.error(
        `Second attempt failed for ${operationName}`,
        error instanceof Error ? error.stack : String(error),
      );
      return false;
    }
  }

  private async tryExecuteWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      this.logger.warn(
        `First attempt failed for ${operationName}, retrying...`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    try {
      return await operation();
    } catch (error) {
      this.logger.error(
        `Second attempt failed for ${operationName}`,
        error instanceof Error ? error.stack : String(error),
      );
      return null;
    }
  }
}
