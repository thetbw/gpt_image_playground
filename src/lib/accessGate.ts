const SESSION_KEY = 'access-granted'
const PASSWORD_KEY = 'access-password'

function getSessionStorage(): Storage | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage
  } catch {
    return null
  }
}

export function readAccessSession(): boolean {
  return getSessionStorage()?.getItem(SESSION_KEY) === '1'
}

export function writeAccessSession(granted: boolean) {
  const storage = getSessionStorage()
  if (!storage) return
  if (granted) storage.setItem(SESSION_KEY, '1')
  else storage.removeItem(SESSION_KEY)
}

export function readAccessPassword(): string {
  return getSessionStorage()?.getItem(PASSWORD_KEY) ?? ''
}

export function writeAccessPassword(password: string) {
  const storage = getSessionStorage()
  if (!storage) return
  if (password) storage.setItem(PASSWORD_KEY, password)
  else storage.removeItem(PASSWORD_KEY)
}

export async function isAccessGateRequired(): Promise<boolean> {
  try {
    const res = await fetch('/auth/status', {
      method: 'GET',
      cache: 'no-store',
    })
    return res.status === 401
  } catch {
    return false
  }
}
