import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

describe('seed_todo_items.sql', () => {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'postgres',
  });

  let connected = false;

  beforeAll(async () => {
    try {
      await client.connect();
      connected = true;
      const sqlPath = path.resolve(__dirname, '../../scripts/seed_todo_items.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await client.query(sql);
    } catch (err: any) {
      // If DB isn't available in the environment, skip the integration test
      // The test will be a no-op in that environment
      // To run this test locally, ensure Postgres is running and env vars are set
      // e.g. DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE
      // eslint-disable-next-line no-console
      console.warn('Database not available, skipping seed test:', err?.message ?? err);
    }
  }, 120000);

  afterAll(async () => {
    if (connected) {
      await client.end();
    }
  });

  it('inserts exactly 100000 items for todoListId=1', async () => {
    if (!connected) {
      // Skip assertion when DB not available
      return;
    }

    const res = await client.query('SELECT COUNT(*)::int AS cnt FROM todo_item WHERE "todoListId" = $1', [1]);
    expect(Number(res.rows[0].cnt)).toBe(100000);
  }, 60000);
});
