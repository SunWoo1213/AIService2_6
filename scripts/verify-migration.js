/**
 * 마이그레이션 검증 스크립트
 * 사용법: node scripts/verify-migration.js
 * 
 * user_profiles 테이블의 스키마가 올바르게 설정되었는지 확인합니다.
 */

require('dotenv').config();
const { Client } = require('pg');

const REQUIRED_COLUMNS = [
  { name: 'id', type: 'integer' },
  { name: 'user_id', type: 'integer' },
  { name: 'age', type: 'integer' },
  { name: 'gender', type: 'character varying' },
  { name: 'current_job', type: 'character varying' },
  { name: 'career_summary', type: 'text' },
  { name: 'certifications', type: 'text' },
  { name: 'career_json', type: 'jsonb' },
  { name: 'education_json', type: 'jsonb' },
  { name: 'certificates_json', type: 'jsonb' },
  { name: 'skills_json', type: 'jsonb' },
  { name: 'created_at', type: 'timestamp without time zone' },
  { name: 'updated_at', type: 'timestamp without time zone' },
];

const REQUIRED_INDEXES = [
  'user_profiles_pkey',
  'user_profiles_user_id_key',
  'idx_user_profiles_user_id',
  'idx_user_profiles_current_job',
];

async function verifyMigration() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!dbUrl) {
    console.error('❌ DATABASE_URL 또는 POSTGRES_URL 환경 변수가 설정되지 않았습니다.');
    process.exit(1);
  }

  console.log('🔍 마이그레이션 검증 시작...\n');

  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공\n');

    // 1. 테이블 존재 확인
    console.log('📊 1. user_profiles 테이블 존재 확인...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.error('❌ user_profiles 테이블이 존재하지 않습니다.');
      console.error('💡 먼저 "node scripts/migrate.js"를 실행하세요.');
      process.exit(1);
    }
    console.log('   ✅ user_profiles 테이블 존재함\n');

    // 2. 컬럼 확인
    console.log('📋 2. 필수 컬럼 확인...');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles'
      ORDER BY ordinal_position;
    `);

    const existingColumns = columnsResult.rows;
    const existingColumnNames = existingColumns.map(col => col.column_name);

    let allColumnsPresent = true;
    let missingColumns = [];

    for (const requiredCol of REQUIRED_COLUMNS) {
      const exists = existingColumns.find(
        col => col.column_name === requiredCol.name && 
               col.data_type === requiredCol.type
      );

      if (exists) {
        console.log(`   ✅ ${requiredCol.name} (${requiredCol.type})`);
      } else {
        console.log(`   ❌ ${requiredCol.name} (${requiredCol.type}) - 누락됨`);
        allColumnsPresent = false;
        missingColumns.push(requiredCol.name);
      }
    }

    if (!allColumnsPresent) {
      console.error('\n❌ 일부 컬럼이 누락되었습니다:', missingColumns.join(', '));
      console.error('💡 "node scripts/run-migration.js"를 실행하세요.');
      process.exit(1);
    }
    console.log();

    // 3. 인덱스 확인
    console.log('🔑 3. 인덱스 확인...');
    const indexResult = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'user_profiles';
    `);

    const existingIndexes = indexResult.rows.map(row => row.indexname);
    let allIndexesPresent = true;

    for (const requiredIndex of REQUIRED_INDEXES) {
      if (existingIndexes.includes(requiredIndex)) {
        console.log(`   ✅ ${requiredIndex}`);
      } else {
        console.log(`   ⚠️  ${requiredIndex} - 누락됨`);
        allIndexesPresent = false;
      }
    }
    console.log();

    // 4. 데이터 무결성 확인
    console.log('🔐 4. 데이터 무결성 확인...');
    const dataCheck = await client.query(`
      SELECT 
        COUNT(*) as total_profiles,
        COUNT(user_id) as valid_user_ids,
        COUNT(DISTINCT user_id) as unique_users
      FROM user_profiles;
    `);

    const stats = dataCheck.rows[0];
    console.log(`   📊 총 프로필 수: ${stats.total_profiles}`);
    console.log(`   📊 유효한 user_id: ${stats.valid_user_ids}`);
    console.log(`   📊 고유 사용자 수: ${stats.unique_users}`);

    if (stats.total_profiles !== stats.valid_user_ids) {
      console.log('   ⚠️  일부 프로필에 user_id가 NULL입니다.');
    } else {
      console.log('   ✅ 모든 프로필이 유효한 user_id를 가지고 있습니다.');
    }
    console.log();

    // 5. 외래 키 확인
    console.log('🔗 5. 외래 키 제약조건 확인...');
    const fkCheck = await client.query(`
      SELECT 
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'user_profiles';
    `);

    if (fkCheck.rows.length > 0) {
      fkCheck.rows.forEach(fk => {
        console.log(`   ✅ ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    } else {
      console.log('   ⚠️  외래 키 제약조건이 없습니다.');
    }
    console.log();

    // 6. 새로운 필드 사용 현황
    console.log('📈 6. 새로운 필드 사용 현황...');
    const usageCheck = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(current_job) as with_current_job,
        COUNT(career_summary) as with_career_summary,
        COUNT(certifications) as with_certifications,
        ROUND(COUNT(current_job)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as current_job_percent
      FROM user_profiles;
    `);

    const usage = usageCheck.rows[0];
    console.log(`   📊 current_job 입력된 프로필: ${usage.with_current_job}/${usage.total} (${usage.current_job_percent || 0}%)`);
    console.log(`   📊 career_summary 입력된 프로필: ${usage.with_career_summary}/${usage.total}`);
    console.log(`   📊 certifications 입력된 프로필: ${usage.with_certifications}/${usage.total}`);
    console.log();

    // 최종 결과
    console.log('═'.repeat(60));
    if (allColumnsPresent && allIndexesPresent) {
      console.log('✨ 마이그레이션 검증 성공! 모든 항목이 정상입니다.');
      console.log('✅ user_profiles 테이블이 올바르게 구성되었습니다.');
    } else {
      console.log('⚠️  마이그레이션 검증 완료 - 일부 권장 항목이 누락되었습니다.');
      if (!allIndexesPresent) {
        console.log('💡 누락된 인덱스는 성능에 영향을 줄 수 있습니다.');
      }
    }
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('\n❌ 검증 중 오류 발생:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 데이터베이스에 연결할 수 없습니다. DATABASE_URL을 확인해주세요.');
    } else if (error.code === '42P01') {
      console.error('💡 테이블이 존재하지 않습니다. 먼저 마이그레이션을 실행하세요.');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

// 스크립트 실행
verifyMigration();

