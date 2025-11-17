/**
 * 데이터베이스 마이그레이션 스크립트
 * 사용법: node scripts/migrate.js
 */

// .env 파일 로드
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function migrate() {
  // 환경 변수 확인
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL 환경 변수가 설정되지 않았습니다.');
    console.error('💡 .env 파일을 확인해주세요.');
    process.exit(1);
  }

  console.log('🔗 데이터베이스 연결 시도 중...');
  console.log('📍 HOST:', process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || '(확인 불가)');

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

