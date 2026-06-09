import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateTodoListDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
