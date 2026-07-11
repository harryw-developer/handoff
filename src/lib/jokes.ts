export const HERO_TAGLINES = [
  'your old tech deserves a second date.',
  'one person’s drawer of shame is another’s treasure.',
  'landfills hate this one simple trick.',
  'that router isn’t "vintage". give it away.',
]

export const EMPTY_CATALOGUE = [
  'nothing here yet. somewhere, a drawer full of cables is very relieved.',
  'the shelves are empty. even the dust has been handed off.',
]

export const EMPTY_MESSAGES = [
  'no chats yet. your inbox is as clean as a freshly wiped hard drive.',
  'it’s quiet in here. too quiet. go claim a mysterious gadget.',
]

export const LOADING_LINES = [
  'untangling the cables…',
  'blowing on the cartridge…',
  'asking the router nicely…',
  'turning it off and on again…',
]

export const FOOTER_JOKES = [
  'no tech was harmed in the making of this handoff.',
  'proudly rehoming gadgets since about ten minutes ago.',
  'warning: may cause dangerously empty drawers.',
  'all items 100% free. cables sold separately. (joke — they’re free too.)',
]

export const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
