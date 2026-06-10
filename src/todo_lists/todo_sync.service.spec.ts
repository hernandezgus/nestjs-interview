import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TodoSyncService } from './todo_sync.service';
import { ExternalTodoApiService } from './external_todo_api.service';
import { TodoItem } from './todo_item.entity';
import { TodoList } from './todo_list.entity';

describe('TodoSyncService', () => {
  let todoSyncService: TodoSyncService;
  let todoListRepositoryMock: jest.Mocked<Record<string, jest.Mock>>;
  let todoItemRepositoryMock: jest.Mocked<Record<string, jest.Mock>>;
  let externalTodoApiServiceMock: {
    getTodoLists: jest.Mock;
    createTodoList: jest.Mock;
    updateTodoList: jest.Mock;
    createTodoItem: jest.Mock;
    updateTodoItem: jest.Mock;
  };

  beforeEach(async () => {
    todoListRepositoryMock = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    todoItemRepositoryMock = {
      delete: jest.fn(),
    } as any;

    externalTodoApiServiceMock = {
      getTodoLists: jest.fn(),
      createTodoList: jest.fn(),
      updateTodoList: jest.fn(),
      createTodoItem: jest.fn(),
      updateTodoItem: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodoSyncService,
        {
          provide: ExternalTodoApiService,
          useValue: externalTodoApiServiceMock,
        },
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

    todoSyncService = module.get<TodoSyncService>(TodoSyncService);
  });

  it('should create local lists from external service', async () => {
    const externalLists = [
      {
        id: 'external-1',
        name: 'External List',
        items: [{ description: 'Task 1', completed: false }],
      },
    ];
    const localLists = [{ id: 1, name: 'Local List', items: [] }];
    const createdTodoList = {
      id: 2,
      name: 'External List',
      items: [{ id: 1, name: 'Task 1', completed: false }],
    };

    externalTodoApiServiceMock.getTodoLists.mockResolvedValue(externalLists);
    todoListRepositoryMock.find.mockResolvedValue(localLists);
    todoListRepositoryMock.create.mockReturnValue(createdTodoList);
    todoListRepositoryMock.save.mockResolvedValue(createdTodoList);
    externalTodoApiServiceMock.createTodoList.mockResolvedValue({
      id: 'external-local-1',
      name: 'Local List',
      items: [],
    });
    externalTodoApiServiceMock.createTodoItem.mockResolvedValue({
      id: 'external-item-1',
      description: 'Task 1',
      completed: false,
    });

    const result = await todoSyncService.syncFromExternal();

    expect(todoListRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'External List',
        items: [
          expect.objectContaining({
            name: 'Task 1',
            completed: false,
          }),
        ],
      }),
    );
    expect(todoListRepositoryMock.save).toHaveBeenCalledWith(createdTodoList);
    expect(result.createdLocal).toBe(1);
    expect(result.success).toBe(true);
  });

  it('should propagate local list and item creation to external service', async () => {
    const localLists = [
      {
        id: 1,
        name: 'Local List',
        items: [{ id: 1, name: 'Write tests', completed: true }],
      },
    ];

    externalTodoApiServiceMock.getTodoLists.mockResolvedValue([]);
    todoListRepositoryMock.find.mockResolvedValue(localLists);
    externalTodoApiServiceMock.createTodoList.mockResolvedValue({
      id: 'external-list-1',
      name: 'Local List',
      items: [],
    });
    externalTodoApiServiceMock.createTodoItem.mockResolvedValue({
      id: 'external-item-1',
      description: 'Write tests',
      completed: true,
    });

    const result = await todoSyncService.syncFromExternal();

    expect(externalTodoApiServiceMock.createTodoList).toHaveBeenCalledWith({
      name: 'Local List',
    });
    expect(externalTodoApiServiceMock.createTodoItem).toHaveBeenCalledWith(
      'external-list-1',
      {
        description: 'Write tests',
        completed: true,
      },
    );
    expect(result.createdExternal).toBe(2);
    expect(result.success).toBe(true);
  });
});
