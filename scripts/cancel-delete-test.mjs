// Tests cancel_handoff + owner delete. Run: node scripts/cancel-delete-test.mjs
import { createClient } from '@supabase/supabase-js'

const URL = 'https://zxwcbctqsvxkdouqldmr.supabase.co'
const KEY = 'sb_publishable_5jxUIRbN1UDe2pbrbSczgA_tTsPeLQF'
const giver = createClient(URL, KEY)
const receiver = createClient(URL, KEY)
const results = []
const check = (name, ok, extra = '') => {
  results.push(ok)
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`)
}

const g = await giver.auth.signInWithPassword({ email: 'giver@test.handoff.local', password: 'handoff-test-1234' })
const r = await receiver.auth.signInWithPassword({ email: 'receiver@test.handoff.local', password: 'handoff-test-1234' })

const { data: listing } = await giver
  .from('listings')
  .insert({ owner_id: g.data.user.id, title: 'Cancel-test webcam (temporary)', category: 'peripherals', condition: 'good', location_area: 'Testville' })
  .select('*')
  .single()
check('giver creates listing', !!listing)

const { data: conv } = await receiver
  .from('conversations')
  .insert({ listing_id: listing.id, giver_id: g.data.user.id, receiver_id: r.data.user.id })
  .select('*')
  .single()
await giver.rpc('set_delivery_method', { p_conversation_id: conv.id, p_method: 'pickup', p_pickup_location: 'Test corner' })
const { error: confErr } = await giver.rpc('confirm_handoff', { p_conversation_id: conv.id })
check('handoff confirmed', !confErr, confErr?.message ?? '')

const anon = createClient(URL, KEY)
const { data: pub1 } = await anon.from('listings').select('id').eq('status', 'available').eq('id', listing.id)
check('confirmed listing hidden from catalogue query', pub1.length === 0)

const { error: recvCancel } = await receiver.rpc('cancel_handoff', { p_listing_id: listing.id })
check('receiver cannot cancel handoff', !!recvCancel, recvCancel?.message ?? '')

const { error: cancelErr } = await giver.rpc('cancel_handoff', { p_listing_id: listing.id })
check('giver cancels handoff', !cancelErr, cancelErr?.message ?? '')

const { data: pub2 } = await anon.from('listings').select('id,status').eq('id', listing.id).single()
check('listing back in catalogue', pub2.status === 'available')
const { data: conv2 } = await giver.from('conversations').select('handoff_confirmed_at').eq('id', conv.id).single()
check('conversation confirmation cleared', conv2.handoff_confirmed_at === null)

const { error: dblCancel } = await giver.rpc('cancel_handoff', { p_listing_id: listing.id })
check('cancel blocked when not handed off', !!dblCancel, dblCancel?.message ?? '')

// deletion: receiver can't, owner can (cascade removes conversation + messages)
const { data: recvDel } = await receiver.from('listings').delete().eq('id', listing.id).select('id')
check('receiver cannot delete listing', !recvDel || recvDel.length === 0)
const { data: ownDel } = await giver.from('listings').delete().eq('id', listing.id).select('id')
check('owner deletes listing', ownDel?.length === 1)
const { data: orphan } = await receiver.from('conversations').select('id').eq('id', conv.id)
check('chats removed with listing', orphan.length === 0)

console.log(`\n${results.filter(Boolean).length}/${results.length} checks passed`)
process.exit(results.every(Boolean) ? 0 : 1)
