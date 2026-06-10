import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ExternalTodoApiService {
  private readonly baseUrl: string =
    process.env.EXTERNAL_API_URL || 'http://localhost:3001';

  async getTodoLists(): Promise<any[]> {
    const response = await axios.get(`${this.baseUrl}/todolists`);
    return response.data;
  }

  async createTodoList(data: any): Promise<any> {
    const response = await axios.post(`${this.baseUrl}/todolists`, data);
    return response.data;
  }

  async updateTodoList(listId: string, data: any): Promise<any> {
    const response = await axios.put(
      `${this.baseUrl}/todolists/${listId}`,
      data,
    );
    return response.data;
  }

  async createTodoItem(listId: string, item: any): Promise<any> {
    const response = await axios.post(
      `${this.baseUrl}/todolists/${listId}/items`,
      item,
    );
    return response.data;
  }

  async updateTodoItem(
    listId: string,
    itemId: string,
    item: any,
  ): Promise<any> {
    const response = await axios.put(
      `${this.baseUrl}/todolists/${listId}/items/${itemId}`,
      item,
    );
    return response.data;
  }
}
