/**
 * 프로덕션 데이터베이스 마이그레이션 실행
 * 사용법: node scripts/run-prod-migration.js
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// .env.prod.local 파일 로드
require('dotenv').config({ path: '.env.prod.local' });

async function runProductionMigration() {
  // DATABASE_URL 확인 (여러 변수명 시도)
  const dbUrl = 
    process.env.storage_POSTGRES_URL || 
    process.env.POSTGRES_URL || 
    process.env.DATABASE_URL ||
    process.env.storage_DATABASE_URL;

  if (!dbUrl) {
    console.error('❌ 데이터베이스 URL을 찾을 수 없습니다.');
    console.error('💡 다음 명령어로 환경 변수를 먼저 가져오세요:');
    console.error('   vercel env pull .env.prod.local --environment production');
    process.exit(1);
  }

  console.log('🔗 프로덕션 데이터베이스 연결 중...\n');

  // 호스트 정보만 표시 (보안)
  try {
    const url = new URL(dbUrl);
    console.log('📍 HOST:', url.hostname);
    console.log('📍 DATABASE:', url.pathname.substring(1));
  } catch (e) {
    console.log('📍 데이터베이스 URL 확인됨');
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false  // Neon/Vercel Postgres는 SSL 필요
    }
  });

  try {
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공\n');

    // 마이그레이션 SQL 읽기
    const migrationPath = path.join(__dirname, '../migration-prod.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 실행할 마이그레이션:');
    console.log('─'.repeat(60));
    console.log(migrationSql);
    console.log('─'.repeat(60));
    console.log();

    // 기존 컬럼 확인
    console.log('🔍 현재 user_profiles 테이블 구조 확인 중...');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles'
      ORDER BY ordinal_position
    `);

    console.log('현재 컬럼 목록:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    console.log();

    // 마이그레이션 실행
    console.log('🚀 마이그레이션 실행 중...\n');
    
    // SQL을 개별 명령으로 분리하여 실행
    const sqlCommands = migrationSql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--'));

    for (const sql of sqlCommands) {
      if (sql.toUpperCase().startsWith('SELECT')) {
        // SELECT 쿼리는 결과 출력
        console.log('📊 확인 쿼리 실행...');
        const result = await client.query(sql);
        console.log('\n결과:');
        console.table(result.rows);
      } else {
        // ALTER, CREATE 등은 실행만
        await client.query(sql);
      }
    }

    console.log('\n✅ 마이그레이션 완료!\n');

    // 최종 확인
    console.log('🔍 최종 확인: 새로운 컬럼 조회');
    const finalCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles' 
        AND column_name IN ('current_job', 'career_summary', 'certifications')
      ORDER BY column_name
    `);

    if (finalCheck.rows.length === 3) {
      console.log('\n✨ 성공! 3개 컬럼이 모두 추가되었습니다:');
      finalCheck.rows.forEach(col => {
        console.log(`  ✅ ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log('\n⚠️  경고: 예상한 컬럼 수와 다릅니다.');
      console.log('추가된 컬럼:', finalCheck.rows.length, '/ 3');
    }

    console.log('\n═'.repeat(60));
    console.log('✨ 프로덕션 마이그레이션 완료!');
    console.log('═'.repeat(60));
    console.log();
    console.log('💡 다음 단계:');
    console.log('  1. Vercel 로그 확인: vercel logs --prod');
    console.log('  2. 에러가 계속되면 재배포: vercel --prod --force');
    console.log();

  } catch (error) {
    console.error('\n❌ 마이그레이션 실패:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 데이터베이스에 연결할 수 없습니다.');
    } else if (error.code === '42P01') {
      console.error('\n💡 user_profiles 테이블이 존재하지 않습니다.');
      console.error('   먼저 기본 스키마를 생성하세요: npm run db:migrate');
    } else if (error.code === '42701') {
      console.error('\n💡 컬럼이 이미 존재합니다. 마이그레이션이 이미 완료되었을 수 있습니다.');
      console.error('   확인: npm run db:verify');
    } else {
      console.error('\n상세 에러:');
      console.error(error);
    }
    
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 데이터베이스 연결 종료\n');
  }
}

// 실행
console.log('🚀 프로덕션 데이터베이스 마이그레이션 시작...\n');
runProductionMigration();

