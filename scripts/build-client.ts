/**
 * クライアントサイドTypeScriptをビルドし、サーバー側からimport可能なJS文字列としてエクスポートするスクリプト。
 * 
 * 使い方: npx tsx scripts/build-client.ts
 * 
 * 各エントリポイント (src/client/*.ts) に対して:
 * 1. esbuild で IIFE形式にバンドル + minify
 * 2. 結果を export const xxxScript = "..." として src/views/scripts/generated/ に書き出す
 */

import * as esbuild from 'esbuild'
import * as fs from 'fs'
import * as path from 'path'

const CLIENT_DIR = path.resolve(__dirname, '../src/client')
const OUTPUT_DIR = path.resolve(__dirname, '../src/views/scripts/generated')

// エントリポイントとエクスポート名のマッピング
interface EntryConfig {
  file: string       // src/client/ 配下のファイル名
  exportName: string  // export const の名前
}

const entries: EntryConfig[] = [
  { file: 'accountGroups.ts', exportName: 'accountGroupsClientScript' },
  { file: 'groups.ts', exportName: 'groupsClientScript' },
  { file: 'apps.ts', exportName: 'getAppsClientScript' },
  { file: 'users.ts', exportName: 'usersClientScript' },
  { file: 'accountAssignments.ts', exportName: 'accountAssignmentsClientScript' },
  { file: 'accountDevelopers.ts', exportName: 'accountDevelopersClientScript' },
  { file: 'account.ts', exportName: 'accountClientScript' },
  { file: 'serviceAppsModal.ts', exportName: 'serviceAppsModalClientScript' },
  { file: 'rejectReasonModal.ts', exportName: 'RejectReasonModalScript' },
  // groupAdmin.ts は Phase 2 最後に追加（87KB の大規模ファイル）
  { file: 'groupAdmin.ts', exportName: 'groupAdminClientScript' },
]

async function build() {
  // 出力ディレクトリを確保
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  for (const entry of entries) {
    const entryPath = path.join(CLIENT_DIR, entry.file)
    if (!fs.existsSync(entryPath)) {
      console.error(`[build-client] エントリポイントが見つかりません: ${entryPath}`)
      process.exit(1)
    }

    const result = await esbuild.build({
      entryPoints: [entryPath],
      bundle: true,
      format: 'iife',
      minify: true,
      write: false,
      target: 'es2020',
      charset: 'utf8',
    })

    const jsCode = result.outputFiles[0].text.trim()

    // エスケープ: バッククォート・ドル記号・バックスラッシュをエスケープ
    const escaped = jsCode
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$')

    const outputContent = [
      '// このファイルは自動生成されています。直接編集しないでください。',
      `// ソース: src/client/${entry.file}`,
      `// ビルド日時: ${new Date().toISOString()}`,
      '',
      `export const ${entry.exportName} = \`${escaped}\`;`,
      '',
    ].join('\n')

    const outputPath = path.join(OUTPUT_DIR, entry.file.replace(/\.ts$/, '.ts'))
    fs.writeFileSync(outputPath, outputContent, 'utf-8')
    console.log(`[build-client] ✓ ${entry.file} → generated/${path.basename(outputPath)} (${jsCode.length} bytes)`)
  }

  console.log(`[build-client] 全 ${entries.length} エントリのビルドが完了しました。`)
}

build().catch((err) => {
  console.error('[build-client] ビルドエラー:', err)
  process.exit(1)
})
