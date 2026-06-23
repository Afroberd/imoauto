'use client'

import { useState, useEffect, useRef, useCallback, useId } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  getNotifications, markAllRead, markRead, type Notification,
} from '@/app/actions/notifications'
import { BellIcon } from '@/components/icons'

interface Props {
  userId: string
  initialUnread: number
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
}

export function NotificationBell({ userId, initialUnread }: Props) {
  const router = useRouter()
  const [unread, setUnread] = useState(initialUnread)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  // Unique per component instance: the header mounts this bell twice (desktop +
  // mobile). Two channels with the same topic make supabase-js throw
  // "cannot add postgres_changes callbacks after subscribe()", which crashed
  // the whole app. A per-instance id keeps the channel topics distinct.
  const instanceId = useId()

  // Live updates: bump the badge whenever a new notification row arrives.
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`notif:${userId}:${instanceId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          setUnread((n) => n + 1)
          setItems((prev) => [payload.new as Notification, ...prev].slice(0, 15))
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, instanceId])

  // Close on click outside / Escape.
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const loadAndOpen = useCallback(async () => {
    if (open) { setOpen(false); return }
    setOpen(true)
    setLoading(true)
    const { items: fetched, unreadCount } = await getNotifications()
    setItems(fetched)
    setUnread(unreadCount)
    setLoading(false)
    // Opening the panel marks everything read.
    if (unreadCount > 0) {
      await markAllRead()
      setUnread(0)
    }
  }, [open])

  async function handleClickItem(n: Notification) {
    if (!n.read_at) await markRead(n.id)
    setOpen(false)
    if (n.link) router.push(n.link)
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={loadAndOpen}
        aria-label="Notificações"
        className="relative inline-flex items-center rounded-full px-3 py-2 text-text-2 transition-colors hover:bg-shell-soft hover:text-ink"
      >
        <BellIcon className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-medium leading-none text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-[var(--radius-card)] border border-shell bg-white shadow-[var(--shadow-pop)]">
          <div className="flex items-center justify-between border-b border-shell px-4 py-3">
            <p className="text-sm font-medium text-ink">Notificações</p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-6 text-center text-[13px] text-text-3">A carregar…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-10 text-center text-[13px] text-text-3">Sem notificações.</p>
            ) : (
              <ul className="divide-y divide-shell/70">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleClickItem(n)}
                      className={`flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-paper-soft ${
                        n.read_at ? '' : 'bg-sky-soft/40'
                      }`}
                    >
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-[13px] font-medium text-ink">{n.title}</span>
                        <span className="flex-shrink-0 text-[11px] text-text-3 tnum">
                          {relativeTime(n.created_at)}
                        </span>
                      </span>
                      {n.body && <span className="truncate text-[12px] text-text-2">{n.body}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
