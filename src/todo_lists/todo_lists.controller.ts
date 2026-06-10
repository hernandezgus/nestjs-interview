import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTodoListDto } from './dtos/create-todo_list';
import { UpdateTodoListDto } from './dtos/update-todo_list';
import { TodoList } from '../interfaces/todo_list.interface';
import { TodoListsService } from './todo_lists.service';
import { TodoSyncService } from './todo_sync.service';

@Controller('api/todolists')
@UseGuards(JwtAuthGuard)
export class TodoListsController {
  constructor(
    private todoListsService: TodoListsService,
    private todoSyncService: TodoSyncService,
  ) {}

  @Get()
  index(): Promise<TodoList[]> {
    return this.todoListsService.all();
  }

  @Get('/:todoListId')
  show(
    @Param('todoListId', ParseIntPipe) todoListId: number,
  ): Promise<TodoList> {
    return this.todoListsService.get(todoListId);
  }

  @Post()
  create(@Body() dto: CreateTodoListDto): Promise<TodoList> {
    return this.todoListsService.create(dto);
  }

  @Post('/sync')
  async sync(): Promise<{
    success: boolean;
    createdLocal: number;
    createdExternal: number;
    updatedExternal: number;
    failed: number;
  }> {
    return this.todoSyncService.syncFromExternal();
  }

  @Put('/:todoListId')
  update(
    @Param('todoListId', ParseIntPipe) todoListId: number,
    @Body() dto: UpdateTodoListDto,
  ): Promise<TodoList> {
    return this.todoListsService.update(todoListId, dto);
  }

  @Delete('/:todoListId')
  delete(@Param('todoListId', ParseIntPipe) todoListId: number): Promise<void> {
    return this.todoListsService.delete(todoListId);
  }
}
