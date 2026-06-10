import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TodoItem } from './todo_item.entity';
import { TodoListsController } from './todo_lists.controller';
import { TodoList } from './todo_list.entity';
import { TodoListsService } from './todo_lists.service';
import { TodoSyncService } from './todo_sync.service';

describe('TodoListsController', () => {
  let app: INestApplication;
  let todoListsController: TodoListsController;
  let todoListRepositoryMock: jest.Mocked<Record<string, jest.Mock>>;
  let todoItemRepositoryMock: jest.Mocked<Record<string, jest.Mock>>;

  beforeEach(async () => {
    todoListRepositoryMock = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    };
    todoItemRepositoryMock = {
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TodoListsController],
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
        {
          provide: TodoSyncService,
          useValue: {
            syncFromExternal: jest.fn(),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    todoListsController = module.get<TodoListsController>(TodoListsController);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('index', () => {
    it('should return all todo lists', async () => {
      const mockTodoLists = [
        { id: 1, name: 'Shopping List', items: [] },
        { id: 2, name: 'Work Tasks', items: [] },
      ];

      todoListRepositoryMock.find.mockResolvedValue(mockTodoLists);

      const result = await todoListsController.index();

      expect(result).toEqual(mockTodoLists);
    });
  });

  describe('show', () => {
    it('should return a single todo list by id', async () => {
      const mockTodoList = { id: 1, name: 'Shopping List', items: [] };
      todoListRepositoryMock.findOneBy.mockResolvedValue(mockTodoList);
      const result = await todoListsController.show(1);
      expect(result).toEqual(mockTodoList);
    });

    it('should throw when a todo list is not found', async () => {
      todoListRepositoryMock.findOneBy.mockResolvedValue(null);

      await expect(todoListsController.show(999)).rejects.toThrow(
        new NotFoundException('Todo list 999 not found'),
      );
    });
  });

  describe('create', () => {
    it('should create a new todo list', async () => {
      const createDto = {
        name: 'New List',
        items: [{ name: 'Buy milk', completed: false }],
      };
      const mockCreatedTodoList = {
        id: 1,
        name: 'New List',
        items: [{ id: 1, name: 'Buy milk', completed: false }],
      };

      todoListRepositoryMock.create.mockReturnValue(mockCreatedTodoList);
      todoListRepositoryMock.save.mockResolvedValue(mockCreatedTodoList);

      const result = await todoListsController.create(createDto);

      expect(result).toEqual(mockCreatedTodoList);
    });
  });

  describe('update', () => {
    it('should update an existing todo list', async () => {
      const updateDto = { name: 'Updated List' };
      const existingTodoList = { id: 1, name: 'Old Name', items: [] };
      const updatedTodoList = { id: 1, name: 'Updated List', items: [] };

      todoListRepositoryMock.findOneBy.mockResolvedValue(existingTodoList);
      todoListRepositoryMock.save.mockResolvedValue(updatedTodoList);

      const result = await todoListsController.update(1, updateDto);

      expect(result).toEqual(updatedTodoList);
    });

    it('should throw when updating a missing todo list', async () => {
      const updateDto = { name: 'Updated List' };
      todoListRepositoryMock.findOneBy.mockResolvedValue(null);

      await expect(todoListsController.update(999, updateDto)).rejects.toThrow(
        new NotFoundException('Todo list 999 not found'),
      );
    });
  });

  describe('delete', () => {
    it('should delete a todo list', async () => {
      todoListRepositoryMock.delete.mockResolvedValue({ affected: 1 });
      await todoListsController.delete(1);
      expect(todoListRepositoryMock.delete).toHaveBeenCalledWith(1);
    });

    it('should throw when deleting a missing todo list', async () => {
      todoListRepositoryMock.delete.mockResolvedValue({ affected: 0 });

      await expect(todoListsController.delete(999)).rejects.toThrow(
        new NotFoundException('Todo list 999 not found'),
      );
    });
  });
});
