import type { Prize } from './types'

function prize(
  id: string,
  label: string,
  description: string,
  rarity: Prize['rarity'],
  category: Prize['category'],
  extras?: Partial<Prize>,
): Prize {
  return {
    id,
    label,
    description,
    rarity,
    active: extras?.active ?? true,
    category,
    stock: extras?.stock,
    notes: extras?.notes,
    mysteryBoxEligible: extras?.mysteryBoxEligible,
    whammyEligible: extras?.whammyEligible,
  }
}

export const DEFAULT_PRIZE_BANK: Prize[] = [
  prize('prize-medium-3d', 'Medium 3D Print', 'A medium-sized custom 3D print reward', 'legendary', 'physical'),
  prize('prize-small-3d', 'Small 3D Print', 'A small custom 3D print reward', 'rare', 'physical', {
    mysteryBoxEligible: true,
  }),
  prize('prize-treasure-box', 'Treasure Box', 'Pick a small item from the treasure box', 'uncommon', 'physical', {
    mysteryBoxEligible: true,
  }),
  prize('prize-mystery-box', 'Mystery Box', 'Opens to reveal a surprise reward from the mystery pool', 'rare', 'container'),
  prize('prize-lunch-friend', 'Lunch with Friend', 'Eat lunch with a friend of your choice', 'rare', 'experience'),
  prize('prize-switch-seat', 'Switch Seat Pass', 'Switch seats for one class period', 'veryRare', 'privilege', {
    mysteryBoxEligible: true,
  }),
  prize('prize-stamps-10', '+10 Stamps', 'Earn ten classroom stamps', 'rare', 'stamps'),
  prize('prize-stamps-5', '+5 Stamps', 'Earn five classroom stamps', 'uncommon', 'stamps', {
    mysteryBoxEligible: true,
  }),
  prize('prize-stamps-3', '+3 Stamps', 'Earn three classroom stamps', 'common', 'stamps', {
    mysteryBoxEligible: true,
  }),
  prize('prize-sticker', 'Sticker or Small Prize', 'Choose a sticker or small prize', 'uncommon', 'physical', {
    mysteryBoxEligible: true,
  }),
  prize('prize-stuffed-animal', 'Stuffed Animal or Toy at Recess', 'Bring a stuffed animal or toy to recess', 'uncommon', 'privilege', {
    mysteryBoxEligible: true,
  }),
  prize('prize-no-shoes', 'No Shoes Pass', 'Take shoes off during class time', 'uncommon', 'privilege'),
  prize('prize-whammy-bait', 'Homework Pass', 'Fake reward — triggers Whammy!', 'rare', 'privilege', {
    active: false,
    whammyEligible: true,
  }),
  prize('prize-teacher-chair', 'Teacher Chair Pass', 'Sit in the teacher chair for one period', 'rare', 'privilege', {
    active: false,
  }),
]

export const MYSTERY_BOX_PRIZE_ID = 'prize-mystery-box'

export const OMITTED_PRIZE_IDS = [
  'prize-no-homework',
  'prize-read-friend',
  'prize-class-dj',
] as const
