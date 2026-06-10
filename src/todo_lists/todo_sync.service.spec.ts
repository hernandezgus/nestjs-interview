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

  it('should return the expected response for a normal sync scenario', async () => {
    const externalLists = [
      {
        id: 'external-1',
        name: 'Only External',
        items: [],
      },
    ];
    const localLists = [
      {
        id: 1,
        name: 'Local List',
        items: [{ id: 1, name: 'Write tests', completed: true }],
      },
    ];
    const createdLocalList = {
      id: 2,
      name: 'Only External',
      items: [],
    };

    externalTodoApiServiceMock.getTodoLists.mockResolvedValue(externalLists);
    todoListRepositoryMock.find.mockResolvedValue(localLists);
    todoListRepositoryMock.create.mockReturnValue(createdLocalList);
    todoListRepositoryMock.save.mockResolvedValue(createdLocalList);
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

    expect(result).toEqual({
      success: true,
      createdLocal: 1,
      createdExternal: 2,
      updatedExternal: 0,
      failed: 0,
    });
  });

  it('should return the expected response when some operations fail', async () => {
    const externalLists = [
      {
        id: 'external-1',
        name: 'External List',
        items: [
          {
            id: 'external-item-1',
            description: 'Existing',
            completed: false,
          },
        ],
      },
      {
        id: 'external-2',
        name: 'Only External',
        items: [],
      },
    ];
    const localLists = [
      {
        id: 1,
        name: 'Local List',
        items: [
          { id: 1, name: 'New Item A', completed: false },
          { id: 2, name: 'New Item B', completed: false },
        ],
      },
      {
        id: 2,
        name: 'External List',
        items: [{ id: 3, name: 'Existing', completed: true }],
      },
    ];
    const createdLocalList = {
      id: 3,
      name: 'Only External',
      items: [],
    };

    externalTodoApiServiceMock.getTodoLists.mockResolvedValue(externalLists);
    todoListRepositoryMock.find.mockResolvedValue(localLists);
    todoListRepositoryMock.create.mockReturnValue(createdLocalList);
    todoListRepositoryMock.save.mockResolvedValue(createdLocalList);
    externalTodoApiServiceMock.createTodoList.mockResolvedValue({
      id: 'external-list-1',
      name: 'Local List',
      items: [],
    });
    externalTodoApiServiceMock.createTodoItem.mockRejectedValue(new Error('Create failed'));
    externalTodoApiServiceMock.updateTodoItem.mockResolvedValue({
      id: 'external-item-1',
      description: 'Existing',
      completed: true,
    });

    const result = await todoSyncService.syncFromExternal();

    expect(result).toEqual({
      success: true,
      createdLocal: 1,
      createdExternal: 1,
      updatedExternal: 1,
      failed: 2,
    });
  });

  it('should return the expected response when external service is down', async () => {
    externalTodoApiServiceMock.getTodoLists.mockRejectedValue(
      new Error('Service unavailable'),
    );

    const result = await todoSyncService.syncFromExternal();

    expect(result).toEqual({
      success: false,
      createdLocal: 0,
      createdExternal: 0,
      updatedExternal: 0,
      failed: 0,
    });
  });
});
