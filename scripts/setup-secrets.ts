import { execSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'

function setSecret(name: string) {
  const randomHex = randomBytes(32).toString('hex')
  console.log(`\nSetting ${name} to a new random 32-byte hex string...`)
  try {
    execSync(`npx wrangler secret put ${name}`, {
      input: randomHex,
      stdio: ['pipe', 'inherit', 'inherit']
    })
    console.log(`✅ Successfully set ${name}`)
  } catch (e) {
    console.error(`❌ Failed to set ${name}`)
    throw e
  }
}

try {
  console.log('Generating and uploading production secrets to Cloudflare...')
  setSecret('OIDC_KEK')
  setSecret('JWT_SECRET')
  console.log('\n🎉 All secrets set successfully!')
} catch (e: any) {
  console.error('\nError:', e.message)
  process.exit(1)
}
