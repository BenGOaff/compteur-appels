import { describe, expect, it } from 'vitest'
import {
  formatDayLabel,
  formatEuros,
  formatMinutes,
  formatSlot,
  formatTime,
  fr,
  NBSP,
  toIsoDay,
} from './format'

describe('formatEuros', () => {
  it('sépare les milliers et colle l’euro avec une espace insécable', () => {
    const valeur = formatEuros(1250)
    expect(valeur.endsWith(NBSP + '€')).toBe(true)
    expect(valeur.replace(/[^\d]/g, '')).toBe('1250')
  })

  it('arrondit à l’unité', () => {
    expect(formatEuros(419.6).replace(/[^\d]/g, '')).toBe('420')
  })
})

describe('formatMinutes', () => {
  it('écrit les minutes seules sous une heure', () => {
    expect(formatMinutes(45)).toBe('45' + NBSP + 'min')
  })

  it('écrit les heures et les minutes', () => {
    expect(formatMinutes(400)).toBe('6' + NBSP + 'h' + NBSP + '40')
  })

  it('écrit les heures rondes sans minutes', () => {
    expect(formatMinutes(120)).toBe('2' + NBSP + 'h')
  })

  it('ne descend jamais sous zéro', () => {
    expect(formatMinutes(-30)).toBe('0' + NBSP + 'min')
  })
})

describe('fr', () => {
  it('pose les espaces insécables de la typographie française', () => {
    expect(fr('Qui appelait ?')).toBe('Qui appelait' + NBSP + '?')
    expect(fr('30 % des appels')).toBe('30' + NBSP + '% des appels')
    expect(fr('Total : 5')).toBe('Total' + NBSP + ': 5')
  })
})

describe('dates', () => {
  it('écrit une date en français', () => {
    const label = formatDayLabel('2026-09-23')
    expect(label).toContain('23')
    expect(label).toContain('septembre')
  })

  it('ne casse pas sur une date illisible', () => {
    expect(formatDayLabel('bonjour')).toBe('bonjour')
  })

  it('construit la clé du jour sur l’heure locale', () => {
    expect(toIsoDay(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
  })
})

describe('heures', () => {
  it('écrit un créneau de deux heures', () => {
    expect(formatSlot(10)).toBe('entre 10' + NBSP + 'h et 12' + NBSP + 'h')
  })

  it('écrit une heure d’appel', () => {
    expect(formatTime('09:05')).toBe('09' + NBSP + 'h' + NBSP + '05')
  })
})
