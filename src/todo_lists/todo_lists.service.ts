import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTodoListDto } from './dtos/create-todo_list';
import { UpdateTodoListDto } from './dtos/update-todo_list';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TodoItem } from './todo_item.entity';
import { TodoList } from './todo_list.entity';

@Injectable()
export class TodoListsService {
  constructor(
    @InjectRepository(TodoList)
    private readonly todoListRepository: Repository<TodoList>,
    @InjectRepository(TodoItem)
    private readonly todoItemRepository: Repository<TodoItem>,
  ) {}

  async all(): Promise<TodoList[]> {
    return await this.todoListRepository.find();
  }

  async get(id: number): Promise<TodoList> {
    const todoList = await this.todoListRepository.findOneBy({ id });

    if (!todoList) {
      throw new NotFoundException(`Todo list ${id} not found`);
    }

    return todoList;
  }

  async create(dto: CreateTodoListDto): Promise<TodoList> {
    const todoList = this.todoListRepository.create({
      name: dto.name,
      items: dto.items.map((item) => ({
        name: item.name,
        completed: item.completed ?? false,
      })),
    });
    return await this.todoListRepository.save(todoList);
  }

  async update(id: number, dto: UpdateTodoListDto): Promise<TodoList> {
    const todoList = await this.get(id);

    if (dto.name !== undefined) {
      todoList.name = dto.name;
    }

    if (dto.items !== undefined) {
      if (dto.items.some((item) => item.name === undefined)) {
        throw new BadRequestException(
          'Each todo item must include a name when replacing items',
        );
      }

      if (todoList.items.length > 0) {
        await this.todoItemRepository.delete(todoList.items.map((item) => item.id));
      }

      todoList.items = dto.items.map((item) => ({
        name: item.name,
        completed: item.completed ?? false,
      })) as TodoItem[];
    }

    return await this.todoListRepository.save(todoList);
  }

  async delete(id: number): Promise<void> {
    const deleteResult = await this.todoListRepository.delete(id);

    if (!deleteResult.affected) {
      throw new NotFoundException(`Todo list ${id} not found`);
    }
  }
}
