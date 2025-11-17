/**
 * PostgreSQL 데이터베이스 연결 유틸리티
 */
import { Pool, QueryResult, QueryResultRow } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('데이터베이스 풀 에러:', err);
    });
  }

  return pool;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  const start = Date.now();
  
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('쿼리 실행:', { text, duration, rows: res.rowCount });
    }
    
    return res;
  } catch (error) {
    console.error('쿼리 에러:', { text, error });
    throw error;
  }
}

export async function getClient() {
  const pool = getPool();
  return await pool.connect();
}

// 트랜잭션 헬퍼
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

const dbService = { query, getPool, getClient, transaction };

export default dbService;

