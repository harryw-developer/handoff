export type Profile = {
  id: string
  username: string
  created_at: string
}

export type Listing = {
  id: string
  owner_id: string
  title: string
  description: string | null
  category: Category
  condition: Condition
  image_url: string | null
  location_area: string
  status: 'available' | 'handed_off'
  created_at: string
  owner?: Profile
}

export type Category = 'computers' | 'phones' | 'audio' | 'gaming' | 'peripherals' | 'oddities'
export type Condition = 'like-new' | 'good' | 'well-loved' | 'mysterious'

export type Conversation = {
  id: string
  listing_id: string
  giver_id: string
  receiver_id: string
  delivery_method: 'pickup' | 'post' | null
  pickup_location: string | null
  address_requested: boolean
  delivery_address: string | null
  handoff_confirmed_at: string | null
  created_at: string
  listing?: Listing
  giver?: Profile
  receiver?: Profile
}

export type Message = {
  id: string
  conversation_id: string
  sender_id: string | null
  kind: 'text' | 'image' | 'system'
  body: string | null
  image_path: string | null
  created_at: string
}

export const CATEGORIES: { id: Category; label: string; emoji: string; joke: string }[] = [
  { id: 'computers', label: 'computers', emoji: '💻', joke: 'laptops, desktops & beige mysteries' },
  { id: 'phones', label: 'phones', emoji: '📱', joke: 'from brick to almost-new' },
  { id: 'audio', label: 'audio', emoji: '🎧', joke: 'one earbud counts. barely.' },
  { id: 'gaming', label: 'gaming', emoji: '🎮', joke: 'blow the cartridge first' },
  { id: 'peripherals', label: 'peripherals', emoji: '🖱️', joke: 'cables. so many cables.' },
  { id: 'oddities', label: 'oddities', emoji: '🤖', joke: 'we don’t know what it is either' },
]

export const CONDITIONS: { id: Condition; label: string; joke: string }[] = [
  { id: 'like-new', label: 'like new', joke: 'barely breathed on' },
  { id: 'good', label: 'good', joke: 'a few stories to tell' },
  { id: 'well-loved', label: 'well loved', joke: 'character-building scratches' },
  { id: 'mysterious', label: 'mysterious', joke: 'it powers on. probably.' },
]
