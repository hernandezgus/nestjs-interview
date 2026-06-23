import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SyncConfigController } from './sync_config.controller';
import { TodoSyncService } from './todo_sync.service';

describe('SyncConfigController', () => {
  let app: INestApplication;
  let todoSyncServiceMock: {
    setAutoSyncEnabled: jest.Mock;
  };

  beforeEach(async () => {
    todoSyncServiceMock = {
      setAutoSyncEnabled: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SyncConfigController],
      providers: [
        {
          provide: TodoSyncService,
          useValue: todoSyncServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should update the runtime sync config and return current state', async () => {
    todoSyncServiceMock.setAutoSyncEnabled.mockReturnValue(false);

    await request(app.getHttpServer())
      .put('/api/config/sync')
      .send({ enabled: false })
      .expect(200, { autoSyncEnabled: false });

    expect(todoSyncServiceMock.setAutoSyncEnabled).toHaveBeenCalledWith(false);
  });
});
