/**
 * 프로덕션 데이터베이스 상태 확인
 */

const { Client } = require('pg');
require('dotenv').config({ path: '.env.prod.local' });

async function checkDatabase() {
  const dbUrl = 
    process.env.storage_POSTGRES_URL || 
    process.env.POSTGRES_URL || 
    process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('❌ 데이터베이스 URL을 찾을 수 없습니다.');
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공\n');

    // 전체 컬럼 확인
    console.log('📊 user_profiles 테이블의 모든 컬럼:');
    console.log('═'.repeat(60));
    const allColumns = await client.query(`
      SELECT 
        column_name, 
        data_type,
        character_maximum_length,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles'
      ORDER BY ordinal_position
    `);

    allColumns.rows.forEach((col, index) => {
      const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      console.log(`${index + 1}. ${col.column_name} - ${col.data_type}${length} - ${nullable}`);
    });

    console.log('\n' + '═'.repeat(60));
    console.log(`총 컬럼 수: ${allColumns.rows.length}`);
    console.log('═'.repeat(60));
    console.log();

    // 특정 컬럼 확인
    const hasCurrentJob = allColumns.rows.some(col => col.column_name === 'current_job');
    const hasCareerSummary = allColumns.rows.some(col => col.column_name === 'career_summary');
    const hasCertifications = allColumns.rows.some(col => col.column_name === 'certifications');

    console.log('🔍 필수 컬럼 존재 여부:');
    console.log(`  ${hasCurrentJob ? '✅' : '❌'} current_job`);
    console.log(`  ${hasCareerSummary ? '✅' : '❌'} career_summary`);
    console.log(`  ${hasCertifications ? '✅' : '❌'} certifications`);
    console.log();

    if (!hasCurrentJob || !hasCareerSummary || !hasCertifications) {
      console.log('❌ 일부 컬럼이 누락되었습니다!');
      console.log('\n💡 해결 방법:');
      console.log('  1. Neon Console에 직접 접속');
      console.log('     https://console.neon.tech');
      console.log('  2. SQL Editor에서 다음 SQL 실행:');
      console.log('\n```sql');
      console.log('ALTER TABLE user_profiles');
      console.log('ADD COLUMN IF NOT EXISTS current_job VARCHAR(200),');
      console.log('ADD COLUMN IF NOT EXISTS career_summary TEXT,');
      console.log('ADD COLUMN IF NOT EXISTS certifications TEXT;');
      console.log('```\n');
    } else {
      console.log('✅ 모든 필수 컬럼이 존재합니다!');
    }

  } catch (error) {
    console.error('❌ 에러:', error.message);
  } finally {
    await client.end();
  }
}

checkDatabase();

