import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

function checkSchemaSync() {
  const schemaPath = path.join(__dirname, '..', 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error('schema.sql not found');
    process.exit(1);
  }

  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  // CREATE TABLE IF NOT EXISTS <table_name> を抽出
  const expectedTables = new Set<string>();
  const regex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/gi;
  let match;
  while ((match = regex.exec(schemaContent)) !== null) {
    expectedTables.add(match[1]);
  }

  console.log('🔍 Checking local database schema sync...');
  try {
    // wrangler d1 execute を使ってローカルDBのテーブル一覧を取得
    const output = execSync('npx wrangler d1 execute tobira-mock-db --local --command="SELECT name FROM sqlite_master WHERE type=\'table\' AND name NOT LIKE \'sqlite_%\' AND name != \'d1_migrations\'" --json', { stdio: 'pipe' }).toString();
    const result = JSON.parse(output);
    
    const localTables = new Set<string>();
    if (result && result.length > 0 && result[0].results) {
      for (const row of result[0].results) {
        localTables.add(row.name);
      }
    }

    const missingTables: string[] = [];
    for (const table of expectedTables) {
      if (!localTables.has(table)) {
        missingTables.push(table);
      }
    }

    if (missingTables.length > 0) {
      console.error('\n❌ ERROR: ローカルDBと schema.sql の状態が同期していません！');
      console.error(`❌ 不足しているテーブル: ${missingTables.join(', ')}`);
      console.error('👉 ローカルDBを最新状態にするため、以下のコマンドを実行してください:');
      console.error('   npm run demo:setup\n');
      process.exit(1);
    } else {
      console.log('✅ Local database is fully in sync with schema.sql (tables match).');
    }

  } catch (err: any) {
    // D1データベースがまだ初期化されていない場合などもここに来る
    console.error('\n❌ ERROR: ローカルDBへのアクセスに失敗したか、まだ初期化されていません。');
    console.error('👉 初回セットアップを行うため、以下のコマンドを実行してください:');
    console.error('   npm run demo:setup\n');
    process.exit(1);
  }
}

checkSchemaSync();
