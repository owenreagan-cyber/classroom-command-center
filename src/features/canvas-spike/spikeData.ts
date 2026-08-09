/**
 * Phase 15M — Sample spike data.
 * Independent of production stores. One Board, two Scenes.
 */

import type { SpikeBoard } from './spikeTypes'

export const SPIKE_BOARD: SpikeBoard = {
  scenes: [
    {
      id: 'morning-arrival',
      title: 'Morning Arrival',
      backgroundColor: '#0f172a',
      widgets: [
        {
          id: 'clock',
          type: 'clock',
          label: 'Current Time',
          x: 800,
          y: 40,
          w: 180,
          h: 80,
          pinned: true,
          settings: {},
        },
        {
          id: 'directions',
          type: 'directions-text',
          label: 'Morning Directions',
          x: 60,
          y: 180,
          w: 500,
          h: 200,
          pinned: false,
          settings: {
            text: '1. Unpack your backpack\n2. Turn in homework\n3. Begin morning work',
          },
        },
      ],
    },
    {
      id: 'silent-work',
      title: 'Silent Work',
      backgroundColor: '#1e293b',
      widgets: [
        {
          id: 'clock',
          type: 'clock',
          label: 'Current Time',
          x: 800,
          y: 40,
          w: 180,
          h: 80,
          pinned: true,
          settings: {},
        },
        {
          id: 'timer',
          type: 'countdown-timer',
          label: 'Work Timer',
          x: 60,
          y: 180,
          w: 300,
          h: 200,
          pinned: false,
          settings: { timerKind: 'general' },
        },
      ],
    },
  ],
}
