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
    teacherNotes: extras?.teacherNotes,
    suggestedCost: extras?.suggestedCost,
    physicalPrize: extras?.physicalPrize,
    passPrivilege: extras?.passPrivilege,
    displayEmoji: extras?.displayEmoji,
    mysteryBoxEligible: extras?.mysteryBoxEligible,
    whammyEligible: extras?.whammyEligible,
  }
}

export const DEFAULT_PRIZE_BANK: Prize[] = [
  // ── Premium Ultra Rare ──
  prize('prize-lunch-friend', 'Lunch with a Friend', 'Eat lunch with a friend of your choice', 'premiumUltraRare', 'experience', {
    displayEmoji: '🍽️',
    suggestedCost: 1000,
    passPrivilege: true,
  }),
  prize('prize-large-3d', 'Large 3D Print', 'A large custom 3D print reward', 'premiumUltraRare', 'physical', {
    displayEmoji: '🖨️',
    physicalPrize: true,
    suggestedCost: 1000,
  }),

  // ── Very Rare ──
  prize('prize-medium-3d', 'Medium 3D Print', 'A medium-sized custom 3D print reward', 'veryRare', 'physical', {
    displayEmoji: '🖨️',
    physicalPrize: true,
    suggestedCost: 600,
  }),
  prize('prize-teacher-chair', 'Teacher Chair', 'Sit in the teacher chair for one period', 'veryRare', 'privilege', {
    displayEmoji: '🪑',
    passPrivilege: true,
    suggestedCost: 600,
  }),

  // ── Rare ──
  prize('prize-small-3d', 'Small 3D Print', 'A small custom 3D print reward', 'rare', 'physical', {
    displayEmoji: '🖨️',
    physicalPrize: true,
    mysteryBoxEligible: true,
    suggestedCost: 350,
  }),
  prize('prize-treasure-box', 'Treasure Box', 'Pick a small item from the treasure box', 'rare', 'physical', {
    displayEmoji: '🎁',
    physicalPrize: true,
    mysteryBoxEligible: true,
    suggestedCost: 250,
  }),
  prize('prize-desk-pet', 'Desk Pet Pass', 'Keep a desk pet for the day', 'rare', 'privilege', {
    displayEmoji: '🐾',
    passPrivilege: true,
    mysteryBoxEligible: true,
    suggestedCost: 300,
  }),
  prize('prize-switch-seat', 'Seat Swap', 'Switch seats for one class period', 'rare', 'privilege', {
    displayEmoji: '💺',
    passPrivilege: true,
    mysteryBoxEligible: true,
    suggestedCost: 250,
  }),
  prize('prize-no-comp', 'No Comp Pass', 'Skip one written comp assessment', 'rare', 'privilege', {
    displayEmoji: '📄',
    passPrivilege: true,
    suggestedCost: 350,
  }),
  prize('prize-show-tell', 'Show & Tell', 'Share something special with the class', 'rare', 'experience', {
    displayEmoji: '🎤',
    passPrivilege: true,
    suggestedCost: 300,
  }),
  prize('prize-toy-recess', 'Toy at Recess', 'Bring a toy to play with at recess', 'rare', 'privilege', {
    displayEmoji: '🧸',
    passPrivilege: true,
    mysteryBoxEligible: true,
    suggestedCost: 300,
  }),
  prize('prize-small-stuffed', 'Small Stuffed Animal', 'Small stuffed animal friend for the day', 'rare', 'physical', {
    displayEmoji: '🧸',
    physicalPrize: true,
    mysteryBoxEligible: true,
    suggestedCost: 300,
  }),
  prize('prize-sit-by-friend', 'Sit by a Friend', 'Choose a seat next to a friend for the day', 'rare', 'privilege', {
    displayEmoji: '👫',
    passPrivilege: true,
    suggestedCost: 300,
  }),

  // ── Common ──
  prize('prize-sticker', 'Sticker', 'Choose a sticker', 'common', 'physical', {
    displayEmoji: '⭐',
    physicalPrize: true,
    mysteryBoxEligible: true,
    suggestedCost: 50,
  }),
  prize('prize-no-shoes', 'Shoes Off Pass', 'Take shoes off during class time', 'common', 'privilege', {
    displayEmoji: '👟',
    passPrivilege: true,
    suggestedCost: 50,
  }),
  prize('prize-power-up', 'Power Up Leader', 'Lead the class power-up routine', 'common', 'experience', {
    displayEmoji: '⚡',
    passPrivilege: true,
    suggestedCost: 100,
  }),
  prize('prize-word-attack', 'Word Attack Leader', 'Lead word attack for the lesson', 'common', 'experience', {
    displayEmoji: '📖',
    passPrivilege: true,
    suggestedCost: 100,
  }),

  // ── Mystery Box container ──
  prize('prize-mystery-box', 'Mystery Box', 'Opens to reveal a surprise reward from the mystery pool', 'rare', 'container', {
    displayEmoji: '❓',
  }),

  // ── Special Event / Inactive ──
  prize('prize-points-test', '+5 Points on Test', 'Add five bonus points to a test or quiz', 'rare', 'specialEvent', {
    active: false,
    displayEmoji: '➕',
    passPrivilege: true,
    suggestedCost: 500,
    teacherNotes: 'Teacher approval required. Special event only.',
  }),

  // ── Deprecated / Inactive (preserved for history) ──
  prize('prize-whammy-bait', 'Surprise Bait (Whammy)', 'Fake reward — triggers Whammy!', 'rare', 'specialEvent', {
    active: false,
    whammyEligible: true,
    displayEmoji: '👹',
    teacherNotes: 'Legacy whammy bait. DO NOT activate.',
  }),
]

export const MYSTERY_BOX_PRIZE_ID = 'prize-mystery-box'

/** Prizes removed from active catalog. IDs preserved for history/compatibility. */
export const DEPRECATED_PRIZE_IDS: string[] = [
  'prize-no-homework',       // Homework Pass — removed
  'prize-read-friend',       // Read with Friend — removed
  'prize-class-dj',          // Class DJ — removed
  'prize-stamps-10',         // +10 Stamps — retired (Phase 15H)
  'prize-stamps-5',          // +5 Stamps — retired (Phase 15H)
  'prize-stamps-3',          // +3 Stamps — retired (Phase 15H)
  'prize-stuffed-animal',    // Split into Toy at Recess + Small Stuffed Animal (Phase 15H)
]

/** For backward compatibility — references the old OMITTED_PRIZE_IDS constant. */
export { DEPRECATED_PRIZE_IDS as OMITTED_PRIZE_IDS }
