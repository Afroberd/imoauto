'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendMessage } from '@/app/actions/messages'
import { SendIcon } from '@/components/icons'

interface Message {
  id: string
  sender_id: string
  body: string
  created_at: string
}

interface Props {
  conversationId: string
  currentUserId: string
  initialMessages: Message[]
}

export function MessageThread({ conversationId, currentUserId, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Supabase Realtime — subscribe to new messages in this conversation
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`conv:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    const text = body.trim()
    if (!text || isPending) return
    setError(null)

    // Optimistic message while the server action runs
    const tempId = `temp-${Date.now()}`
    const optimistic: Message = {
      id: tempId,
      sender_id: currentUserId,
      body: text,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])
    setBody('')

    startTransition(async () => {
      const result = await sendMessage(conversationId, text)
      if (!result.ok) {
        setError(result.error)
        // Roll back the optimistic message
        setMessages((prev) => prev.filter((m) => m.id !== tempId))
        setBody(text) // restore input
      }
      // On success: Realtime pushes the real message which deduplicates by id
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Auto-resize textarea
  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setBody(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        {messages.length === 0 ? (
          <p className="text-center text-[13px] italic text-text-3">
            Ainda sem mensagens. Envia a primeira!
          </p>
        ) : (
          <div className="space-y-2">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} isMine={m.sender_id === currentUserId} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <p className="px-5 py-1 text-[13px] text-red-600">{error}</p>
      )}

      {/* Input */}
      <div className="border-t border-shell bg-paper px-5 py-4">
        <div className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Escreve uma mensagem… (Enter para enviar)"
            rows={1}
            className="flex-1 resize-none overflow-hidden rounded-2xl border border-shell bg-paper-soft px-4 py-3 text-sm text-ink placeholder:text-text-3 focus:border-ink focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={isPending || !body.trim()}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-ink text-paper transition-colors hover:bg-ink-deep disabled:opacity-40"
            aria-label="Enviar mensagem"
          >
            <SendIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message, isMine }: { message: Message; isMine: boolean }) {
  const time = new Date(message.created_at).toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${
          isMine
            ? 'rounded-br-sm bg-ink text-paper'
            : 'rounded-bl-sm bg-shell-soft text-ink'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        <p className={`mt-1 text-[11px] ${isMine ? 'text-paper/60' : 'text-text-3'}`}>
          {time}
        </p>
      </div>
    </div>
  )
}
