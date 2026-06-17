import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const DB_NAME = 'tobira-mock-db';
const SCHEMA_FILE = path.join(__dirname, '..', 'schema.sql');
const SEED_FILE = path.join(__dirname, '..', 'demo-seed.sql');

function runCommand(command: string) {
  console.log(`> ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    process.exit(1);
  }
}

async function main() {
  const isRemote = process.argv.includes('--remote');
  const isClear = process.argv.includes('--clear');
  const targetFlag = isRemote ? '--remote' : '--local';
  const CLEAR_FILE = path.join(__dirname, '..', 'clear-db.sql');
  
  console.log('=============================================');
  console.log(`🚪 Tobira デモ環境の初期化と構築を開始します... (${isRemote ? 'リモート' : 'ローカル'})`);
  console.log('=============================================');

  if (!isRemote) {
    // ローカルD1のデータベース初期化（.wranglerディレクトリの削除）
    const wranglerDir = path.join(__dirname, '..', '.wrangler');
    if (fs.existsSync(wranglerDir)) {
      console.log('既存のローカルデータベースをクリーンアップします...');
      fs.rmSync(wranglerDir, { recursive: true, force: true });
    }
  } else {
    if (isClear) {
      console.log('⚠️ --clearフラグが指定されたため、既存のテーブルをすべて削除します...');
      if (fs.existsSync(CLEAR_FILE)) {
        runCommand(`npx wrangler d1 execute ${DB_NAME} ${targetFlag} --file "${CLEAR_FILE}"`);
      } else {
        console.error(`クリア用SQLファイルが見つかりません: ${CLEAR_FILE}`);
        process.exit(1);
      }
    } else {
      console.log('⚠️ リモートへの実行です。既存のテーブルにデータが追加される可能性があります。');
      console.log('   （既存データを消去してから構築したい場合は --clear オプションを付けてください）');
    }
  }

  // 1. スキーマの作成
  console.log('\n[1/3] データベーススキーマを作成しています...');
  runCommand(`npx wrangler d1 execute ${DB_NAME} ${targetFlag} --file "${SCHEMA_FILE}"`);

  // 2. デモデータの投入
  console.log('\n[2/3] デモ用シードデータを投入しています...');
  if (fs.existsSync(SEED_FILE)) {
    runCommand(`npx wrangler d1 execute ${DB_NAME} ${targetFlag} --file "${SEED_FILE}"`);
  } else {
    console.error(`シードファイルが見つかりません: ${SEED_FILE}`);
    process.exit(1);
  }

  console.log('\n[3/3] デモ環境の構築が完了しました！ ✨');
  console.log('\n=============================================');
  if (!isRemote) {
    console.log('✅ 次のコマンドでローカルサーバーを起動できます:');
    console.log('   npm run dev');
  } else {
    console.log('✅ リモートD1への反映が完了しました。');
  }
  console.log('\n✅ デモ用アカウントについては DEMO_ja.md を参照してください。');
  console.log('=============================================');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
