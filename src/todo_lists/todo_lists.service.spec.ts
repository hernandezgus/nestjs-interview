import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TodoItem } from './todo_item.entity';
import { TodoList } from './todo_list.entity';
import { TodoListsService } from './todo_lists.service';

describe('TodoListsService', () => {
  let service: TodoListsService;
  let todoListRepositoryMock: jest.Mocked<Record<string, jest.Mock>>;
  let todoItemRepositoryMock: jest.Mocked<Record<string, jest.Mock>> & {
    createQueryBuilder?: jest.Mock;
  };

  beforeEach(async () => {
    todoListRepositoryMock = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
      exist: jest.fn(),
    } as any;

    todoItemRepositoryMock = {
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodoListsService,
        {
          provide: getRepositoryToken(TodoList),
          useValue: todoListRepositoryMock,
        },
        {
          provide: getRepositoryToken(TodoItem),
          useValue: todoItemRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<TodoListsService>(TodoListsService);
  });

  it('should complete all pending items for a small list', async () => {
    todoListRepositoryMock.exist.mockResolvedValue(true);
    const builder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 5 }),
    };
    todoItemRepositoryMock.createQueryBuilder!.mockReturnValue(builder);

    const result = await service.completeAll(1);

    expect(result).toEqual({ success: true, totalUpdated: 5, failedRetries: 0 });
    expect(builder.update).toHaveBeenCalledWith(TodoItem);
    expect(builder.where).toHaveBeenCalledWith('todoListId = :todoListId AND completed = false', {
      todoListId: 1,
    });
  });

  it('should complete all pending items for a large list efficiently', async () => {
    todoListRepositoryMock.exist.mockResolvedValue(true);
    const builder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 100000 }),
    };
    todoItemRepositoryMock.createQueryBuilder!.mockReturnValue(builder);

    const result = await service.completeAll(42);

    expect(result).toEqual({ success: true, totalUpdated: 100000, failedRetries: 0 });
    expect(builder.update).toHaveBeenCalledTimes(1);
    expect(builder.set).toHaveBeenCalledWith({ completed: true });
  });

  it('should retry on transient failures and return failedRetries count', async () => {
    todoListRepositoryMock.exist.mockResolvedValue(true);
    const builder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest
        .fn()
        .mockRejectedValueOnce(new Error('Transient failure'))
        .mockResolvedValue({ affected: 10 }),
    };
    todoItemRepositoryMock.createQueryBuilder!.mockReturnValue(builder);

    const result = await service.completeAll(7);

    expect(result).toEqual({ success: true, totalUpdated: 10, failedRetries: 1 });
    expect(builder.execute).toHaveBeenCalledTimes(2);
  });

  it('should throw NotFoundException when the todo list does not exist', async () => {
    todoListRepositoryMock.exist.mockResolvedValue(false);

    await expect(service.completeAll(999)).rejects.toThrow(
      new NotFoundException('Todo list 999 not found'),
    );
  });
});
