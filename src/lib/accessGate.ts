let accessGranted = false
let accessPassword = ''

const unauthorizedListeners = new Set<() => void>()

export function readAccessSession(): boolean {
  return accessGranted
}

export function writeAccessSession(granted: boolean) {
  accessGranted = granted
}

export function readAccessPassword(): string {
  return accessPassword
}

export function writeAccessPassword(password: string) {
  accessPassword = password
}

export function clearAccessState() {
  accessGranted = false
  accessPassword = ''
}

export async function resolveInitialAccessGrant(): Promise<boolean> {
  const required = await isAccessGateRequired()
  clearAccessState()
  return !required
}

export function subscribeToAccessUnauthorized(listener: () => void) {
  unauthorizedListeners.add(listener)
  return () => unauthorizedListeners.delete(listener)
}

export function invalidateAccess() {
  clearAccessState()
  for (const listener of unauthorizedListeners) listener()
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
