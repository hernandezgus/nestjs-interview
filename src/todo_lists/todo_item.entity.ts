import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TodoList } from './todo_list.entity';

@Entity()
export class TodoItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: false })
  completed: boolean;

  @ManyToOne(() => TodoList, (todoList) => todoList.items, {
    onDelete: 'CASCADE',
  })
  todoList: TodoList;
}
