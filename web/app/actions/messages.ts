'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ── Types ─────────────────────────────────────────────────────────────────────

export type StartConversationResult =
  | { ok: true; conversationId: string; isNew: boolean }
  | { ok: false; error: 'unauthenticated' | 'owner' | string }

export type SendMessageResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string }

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * Start (or resume) a conversation between the current user (buyer) and the
 * owner of the given listing (seller). Returns the conversation ID so the
 * client can navigate to /messages/[id].
 */
export async function startConversation(
  listingId: string,
): Promise<StartConversationResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  // Fetch the listing to get the seller.
  const { data: listing } = await supabase
    .from('listings')
    .select('owner_id')
    .eq('id', listingId)
    .maybeSingle()

  if (!listing) return { ok: false, error: 'Anúncio não encontrado.' }
  if (listing.owner_id === user.id) return { ok: false, error: 'owner' }

  const sellerId = listing.owner_id as string

  // Check if a conversation already exists.
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('listing_id', listingId)
    .eq('buyer_id', user.id)
    .maybeSingle()

  if (existing) return { ok: true, conversationId: existing.id as string, isNew: false }

  // Create new conversation.
  const { data: conv, error } = await supabase
    .from('conversations')
    .insert({ listing_id: listingId, buyer_id: user.id, seller_id: sellerId })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }
  return { ok: true, conversationId: conv.id as string, isNew: true }
}

/**
 * Send a message in an existing conversation.
 * The caller must be a participant (RLS enforces this).
 */
export async function sendMessage(
  conversationId: string,
  body: string,
): Promise<SendMessageResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const text = body.trim()
  if (!text) return { ok: false, error: 'Mensagem vazia.' }
  if (text.length > 2000) return { ok: false, error: 'Mensagem demasiado longa (máx. 2000 caracteres).' }

  // Insert the message (RLS verifies participation).
  const { data: msg, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: user.id, body: text })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  // Denormalise last-message snapshot onto the conversation for the inbox view.
  const preview = text.length > 80 ? text.slice(0, 80) + '…' : text
  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString(), last_message_body: preview })
    .eq('id', conversationId)

  revalidatePath('/messages')
  return { ok: true, messageId: msg.id as string }
}
