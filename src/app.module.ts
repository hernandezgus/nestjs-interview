import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TodoListsModule } from './todo_lists/todo_lists.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodoItem } from './todo_lists/todo_item.entity';
import { TodoList } from './todo_lists/todo_list.entity';

@Module({
  imports: [
    AuthModule,
    TodoListsModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [TodoList, TodoItem],
      synchronize: true,
      logging: true,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
