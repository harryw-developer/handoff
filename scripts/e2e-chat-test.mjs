// End-to-end test of the two-way chat + handoff flow using two real clients.
// Run: node scripts/e2e-chat-test.mjs
import { createClient } from '@supabase/supabase-js'

const URL = 'https://zxwcbctqsvxkdouqldmr.supabase.co'
const KEY = 'sb_publishable_5jxUIRbN1UDe2pbrbSczgA_tTsPeLQF'

const giver = createClient(URL, KEY)
const receiver = createClient(URL, KEY)
const results = []
const check = (name, ok, extra = '') => {
  results.push({ name, ok, extra })
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`)
}

const g = await giver.auth.signInWithPassword({ email: 'giver@test.handoff.local', password: 'handoff-test-1234' })
const r = await receiver.auth.signInWithPassword({ email: 'receiver@test.handoff.local', password: 'handoff-test-1234' })
check('both test users sign in', !g.error && !r.error, g.error?.message ?? r.error?.message ?? '')

// Receiver finds the giver's listing and opens a conversation
const { data: listing } = await receiver.from('listings').select('*').eq('title', '27" Dell monitor — pixels all present').single()
check('receiver can read listing', !!listing)

let { data: conv, error: convErr } = await receiver
  .from('conversations')
  .insert({ listing_id: listing.id, giver_id: listing.owner_id, receiver_id: r.data.user.id })
  .select('*')
  .single()
if (convErr?.code === '23505') {
  ;({ data: conv } = await receiver.from('conversations').select('*').eq('listing_id', listing.id).eq('receiver_id', r.data.user.id).single())
}
check('receiver starts conversation', !!conv, convErr && convErr.code !== '23505' ? convErr.message : '')

// Realtime: giver subscribes, receiver sends → giver should get it live
await giver.realtime.setAuth(g.data.session.access_token)
let liveMessage = null
const channel = giver
  .channel(`test-conv-${conv.id}`)
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conv.id}` }, (p) => {
    liveMessage = p.new
  })
await new Promise((resolve) => channel.subscribe((status) => status === 'SUBSCRIBED' && resolve()))

const { error: sendErr } = await receiver.from('messages').insert({ conversation_id: conv.id, sender_id: r.data.user.id, kind: 'text', body: 'hi! is the monitor still up for grabs?' })
check('receiver sends message', !sendErr, sendErr?.message ?? '')
await new Promise((r2) => setTimeout(r2, 4000))
check('giver receives it via realtime', liveMessage?.body === 'hi! is the monitor still up for grabs?')

const { error: replyErr } = await giver.from('messages').insert({ conversation_id: conv.id, sender_id: g.data.user.id, kind: 'text', body: 'yes! want it posted or picked up?' })
check('giver replies (two-way)', !replyErr, replyErr?.message ?? '')

// Image upload to private chat bucket
const png = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='), (c) => c.charCodeAt(0))
const imgPath = `${conv.id}/${crypto.randomUUID()}.png`
const { error: upErr } = await receiver.storage.from('chat').upload(imgPath, png, { contentType: 'image/png' })
check('receiver uploads chat image', !upErr, upErr?.message ?? '')
const { error: imgMsgErr } = await receiver.from('messages').insert({ conversation_id: conv.id, sender_id: r.data.user.id, kind: 'image', image_path: imgPath })
check('image message saved', !imgMsgErr, imgMsgErr?.message ?? '')
const { data: signed, error: signErr } = await giver.storage.from('chat').createSignedUrl(imgPath, 60)
check('giver can view chat image (signed url)', !!signed?.signedUrl, signErr?.message ?? '')

// A third party must NOT see any of this
const outsider = createClient(URL, KEY)
const { data: spyConv } = await outsider.from('conversations').select('*').eq('id', conv.id)
const { data: spyMsgs } = await outsider.from('messages').select('*').eq('conversation_id', conv.id)
const { data: spyImg } = await outsider.storage.from('chat').createSignedUrl(imgPath, 60)
check('outsider cannot read conversation', !spyConv || spyConv.length === 0)
check('outsider cannot read messages', !spyMsgs || spyMsgs.length === 0)
check('outsider cannot access chat image', !spyImg?.signedUrl)

// Handoff rules: confirm must fail before a method is set
const { error: earlyConfirm } = await giver.rpc('confirm_handoff', { p_conversation_id: conv.id })
check('confirm blocked before method chosen', !!earlyConfirm, earlyConfirm?.message ?? '')

// Pickup requires a location tag
const { error: noTag } = await giver.rpc('set_delivery_method', { p_conversation_id: conv.id, p_method: 'pickup', p_pickup_location: ' ' })
check('pickup without location tag rejected', !!noTag, noTag?.message ?? '')

// Receiver cannot set the method
const { error: wrongRole } = await receiver.rpc('set_delivery_method', { p_conversation_id: conv.id, p_method: 'post' })
check('receiver cannot set delivery method', !!wrongRole, wrongRole?.message ?? '')

// Post flow: giver chooses post → address requested
const { error: postErr } = await giver.rpc('set_delivery_method', { p_conversation_id: conv.id, p_method: 'post' })
check('giver chooses post', !postErr, postErr?.message ?? '')
let { data: conv2 } = await giver.from('conversations').select('*').eq('id', conv.id).single()
check('address_requested flag set', conv2.address_requested === true)

// Confirm still blocked until address arrives
const { error: noAddr } = await giver.rpc('confirm_handoff', { p_conversation_id: conv.id })
check('confirm blocked while waiting for address', !!noAddr, noAddr?.message ?? '')

// Giver cannot submit the address on receiver's behalf
const { error: wrongAddr } = await giver.rpc('submit_delivery_address', { p_conversation_id: conv.id, p_address: '1 Sneaky Lane, London, N1 1AA' })
check('giver cannot submit address', !!wrongAddr, wrongAddr?.message ?? '')

// Receiver submits address
const { error: addrErr } = await receiver.rpc('submit_delivery_address', { p_conversation_id: conv.id, p_address: '42 Test Street, London, E2 8AA' })
check('receiver submits address', !addrErr, addrErr?.message ?? '')

// Receiver cannot confirm handoff
const { error: recvConfirm } = await receiver.rpc('confirm_handoff', { p_conversation_id: conv.id })
check('receiver cannot confirm handoff', !!recvConfirm, recvConfirm?.message ?? '')

// Giver confirms
const { error: confErr } = await giver.rpc('confirm_handoff', { p_conversation_id: conv.id })
check('giver confirms handoff', !confErr, confErr?.message ?? '')
const { data: conv3 } = await giver.from('conversations').select('*').eq('id', conv.id).single()
const { data: listing2 } = await outsider.from('listings').select('status').eq('id', listing.id).single()
check('handoff timestamp set', !!conv3.handoff_confirmed_at)
check('listing marked handed_off', listing2.status === 'handed_off')

// System messages exist
const { data: allMsgs } = await giver.from('messages').select('*').eq('conversation_id', conv.id).order('created_at')
const sys = allMsgs.filter((m) => m.kind === 'system')
check('system messages generated', sys.length >= 3, `${sys.length} system messages`)

const failed = results.filter((x) => !x.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
await giver.removeAllChannels()
process.exit(failed.length ? 1 : 0)
