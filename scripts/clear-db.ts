import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as readline from 'readline';

const DB_NAME = 'tobira-mock-db';
const CLEAR_FILE = path.join(__dirname, '..', 'clear-db.sql');

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
  const targetFlag = isRemote ? '--remote' : '--local';
  
  console.log('=============================================');
  console.log(`⚠️  Tobira データベースの初期化(クリア)を開始します (${isRemote ? 'リモート' : 'ローカル'})`);
  console.log('=============================================');
  console.log('※ 全てのテーブルとデータが削除されます。この操作は取り消せません！\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const force = process.argv.includes('--force') || process.argv.includes('-y');

  if (!force) {
    const answer = await new Promise<string>((resolve) => {
      rl.question('本当にデータベースを初期化しますか？ [y/N]: ', resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'y') {
      console.log('初期化をキャンセルしました。');
      process.exit(0);
    }
  } else {
    rl.close();
  }

  if (!fs.existsSync(CLEAR_FILE)) {
    console.error(`クリア用SQLファイルが見つかりません: ${CLEAR_FILE}`);
    process.exit(1);
  }

  if (!isRemote) {
    // ローカルの場合はディレクトリごと消すのが確実
    const wranglerDir = path.join(__dirname, '..', '.wrangler');
    if (fs.existsSync(wranglerDir)) {
      console.log('既存のローカルデータベース(.wrangler)を削除しています...');
      fs.rmSync(wranglerDir, { recursive: true, force: true });
    }
  } else {
    // リモートの場合は clear-db.sql を実行
    console.log('既存のテーブルを削除しています...');
    runCommand(`npx wrangler d1 execute ${DB_NAME} ${targetFlag} --file "${CLEAR_FILE}"`);
  }

  console.log('\n✅ データベースの初期化が完了しました。');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
