/**
 * 데이터베이스 마이그레이션 스크립트
 * 사용법: node scripts/migrate.js
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공');

    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await client.query(schema);
    console.log('✅ 마이그레이션 완료');

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();

