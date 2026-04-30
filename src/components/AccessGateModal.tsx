import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { useStore } from '../store'
import { readAccessSession, writeAccessPassword, writeAccessSession } from '../lib/accessGate'

export default function AccessGateModal() {
  const setAccessGranted = useStore((s) => s.setAccessGranted)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (readAccessSession()) setAccessGranted(true)
  }, [setAccessGranted])

  const cardClass = useMemo(() => `relative z-10 w-full max-w-md rounded-3xl border border-white/50 bg-white/95 p-6 shadow-2xl ring-1 ring-black/5 dark:border-white/[0.08] dark:bg-gray-900/95 dark:ring-white/10 ${shake ? 'animate-[shake_0.28s_ease-in-out]' : ''}`, [shake])

  const verify = async () => {
    if (!password.trim() || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/auth/verify', {
        method: 'POST',
        headers: { 'X-Access-Password': password },
      })
      if (!res.ok) throw new Error('密码错误，请重试')
      setAccessGranted(true)
      writeAccessSession(true)
      writeAccessPassword(password)
    } catch (e) {
      writeAccessSession(false)
      writeAccessPassword('')
      setError(e instanceof Error ? e.message : '校验失败，请重试')
      setShake(true)
      setTimeout(() => setShake(false), 300)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = (e: FormEvent) => { e.preventDefault(); void verify() }
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      void verify()
    }
  }

  return (
    <div data-no-drag-select className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" />
      <form onSubmit={handleSubmit} className={cardClass}>
        <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-100">访问验证</h3>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">请输入访问密码以解锁应用功能。</p>
        <input
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={onKeyDown}
          type="password"
          placeholder="访问密码"
          className="w-full rounded-xl border border-gray-200/70 bg-white/60 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-300 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-200 dark:focus:border-blue-500/50"
        />
        <p className="mt-2 min-h-5 text-xs text-red-500">{error}</p>
        <button
          type="submit"
          disabled={submitting || !password.trim()}
          className="mt-3 w-full rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? '验证中...' : '提交'}
        </button>
      </form>
    </div>
  )
}
