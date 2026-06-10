import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TodoItem } from './todo_item.entity';

@Entity()
export class TodoList {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => TodoItem, (todoItem) => todoItem.todoList, {
    cascade: true,
    eager: true,
  })
  items: TodoItem[];
}
