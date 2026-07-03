import crypto from 'crypto'

const ALGO = 'aes-256-cbc'

function getKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET || process.env.EMAIL_SECRET
  if (!secret) throw new Error('NEXTAUTH_SECRET ou EMAIL_SECRET requis pour chiffrer les credentials')
  // hash en clé 32 bytes
  return crypto.createHash('sha256').update(secret).digest()
}

export function encrypt(text: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

export function decrypt(text: string): string {
  if (!text.includes(':')) return text
  const key = getKey()
  const [ivHex, encrypted] = text.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
