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
}
