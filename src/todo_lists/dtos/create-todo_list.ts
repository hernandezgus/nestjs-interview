import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { CreateTodoItemDto } from './create-todo_item';

export class CreateTodoListDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTodoItemDto)
  items: CreateTodoItemDto[];
}
