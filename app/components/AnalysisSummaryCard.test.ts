// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AnalysisSummaryCard from './AnalysisSummaryCard.vue'

describe('AnalysisSummaryCard', () => {
  it('renders correctly with peak performance stats', async () => {
    const wrapper = await mountSuspended(AnalysisSummaryCard, {
      props: {
        totalGames: 100,
        wins: 60,
        losses: 30,
        draws: 10,
        timeLosses: 5,
        winRate: 60,
        ratingRange: { min: 1800, max: 1950 }
      }
    })

    expect(wrapper.text()).toContain('Peak Performance')
    expect(wrapper.text()).toContain("You're crushing it, bro!")
    expect(wrapper.text()).toContain('100')
    expect(wrapper.text()).toContain('60%')
    expect(wrapper.text()).toContain('60')
    expect(wrapper.text()).toContain('Wins')
    expect(wrapper.text()).toContain('30')
    expect(wrapper.text()).toContain('Losses')
    expect(wrapper.text()).toContain('10')
    expect(wrapper.text()).toContain('Draws')
    expect(wrapper.text()).toContain('5 losses on time')
    expect(wrapper.text()).toContain('Elo: 1800 — 1950')
  })

  it('renders correctly with slump stats', async () => {
    const wrapper = await mountSuspended(AnalysisSummaryCard, {
      props: {
        totalGames: 100,
        wins: 30,
        losses: 60,
        draws: 10,
        timeLosses: 0,
        winRate: 30,
        ratingRange: null
      }
    })

    expect(wrapper.text()).toContain('In a Slump')
    expect(wrapper.text()).toContain('Tough run lately.')
    expect(wrapper.text()).toContain('30%')
    expect(wrapper.text()).not.toContain('losses on time')
  })
})
