import { describe, expect, it } from 'vitest'
import {
  computeResult,
  creneauLePlusCharge,
  equivalenceTemps,
  joursTravailles,
  resumeJour,
} from './calculations'
import { parseStore, type CallerType, type FollowUp, type Settings, type Store } from './storage'

const reglages = (patch: Partial<Settings> = {}): Settings => ({
  startedAt: '2026-01-05T08:00:00.000Z',
  clientValue: 200,
  conversionKnown: null,
  workingDays: 5,
  profile: null,
  ...patch,
})

let compteur = 0
const appel = (
  day: string,
  time: string,
  callerType: CallerType,
  leftMessage = false,
  followUp: FollowUp = null,
) => ({ id: 'a' + compteur++, day, time, callerType, leftMessage, followUp })

const store = (patch: Partial<Store> = {}): Store => ({
  version: 1,
  settings: reglages(),
  calls: [],
  days: [],
  ...patch,
})

describe('joursTravailles', () => {
  it('ne compte rien quand rien n’est noté', () => {
    expect(joursTravailles(store())).toEqual([])
  })

  it('compte un jour ouvert sans appel et un jour avec appels', () => {
    const s = store({
      calls: [appel('2026-01-06', '09:30', 'nouveau')],
      days: [{ day: '2026-01-05', callbackMinutes: 0 }],
    })
    expect(joursTravailles(s)).toEqual(['2026-01-05', '2026-01-06'])
  })

  it('exclut les jours marqués non travaillés, même s’ils portent des appels', () => {
    const s = store({
      calls: [appel('2026-01-05', '09:30', 'nouveau'), appel('2026-01-06', '10:00', 'nouveau')],
      days: [{ day: '2026-01-05', callbackMinutes: 20, notWorked: true }],
    })
    expect(joursTravailles(s)).toEqual(['2026-01-06'])
  })
})

describe('computeResult', () => {
  it('reste neutre quand aucun appel n’est noté', () => {
    const r = computeResult(store())
    expect(r.joursTravailles).toBe(0)
    expect(r.projection).toBe(0)
    expect(r.euroBas).toBe(0)
    expect(r.euroHaut).toBe(0)
    expect(r.aucunePerte).toBe(true)
    expect(r.creneauCharge).toBeNull()
  })

  it('applique le taux connu sur une seule journée', () => {
    const s = store({
      settings: reglages({ conversionKnown: 5, clientValue: 200 }),
      calls: [
        appel('2026-01-05', '09:30', 'nouveau', false, 'parti'),
        appel('2026-01-05', '10:10', 'nouveau', true, 'parti'),
        appel('2026-01-05', '11:00', 'nouveau', false, 'a-faire'),
      ],
      days: [{ day: '2026-01-05', callbackMinutes: 30 }],
    })
    const r = computeResult(s)
    // M = 5 × 4,33 ÷ 1 = 21,65 ; 3 nouveaux perdus × 21,65 × 0,5 × 200 € = 6 495 € → 6 500 €
    expect(r.projection).toBeCloseTo(21.65, 5)
    expect(r.tauxConnu).toBe(true)
    expect(r.euroBas).toBe(6500)
    expect(r.euroHaut).toBe(6500)
    expect(r.minutesMois).toBeCloseTo(649.5, 5)
  })

  it('utilise la fourchette 1 à 3 sur 10 quand le taux est inconnu', () => {
    const s = store({
      settings: reglages({ conversionKnown: null, clientValue: 100 }),
      calls: [appel('2026-01-05', '09:30', 'nouveau', false, 'parti')],
      days: [{ day: '2026-01-05', callbackMinutes: 0 }],
    })
    const r = computeResult(s)
    expect(r.tauxBas).toBe(0.1)
    expect(r.tauxHaut).toBe(0.3)
    // bas = 1 × 21,65 × 0,1 × 100 = 216,5 → 220 ; haut = 1 × 21,65 × 0,3 × 100 = 649,5 → 650
    expect(r.euroBas).toBe(220)
    expect(r.euroHaut).toBe(650)
  })

  it('ajoute les numéros inconnus sans message à la borne haute', () => {
    const s = store({
      settings: reglages({ conversionKnown: null, clientValue: 100 }),
      calls: [
        appel('2026-01-05', '09:00', 'nouveau', false, 'parti'),
        appel('2026-01-05', '09:20', 'client', false, null),
        appel('2026-01-05', '09:40', 'inconnu', false, null),
        appel('2026-01-05', '09:50', 'inconnu', true, null),
        appel('2026-01-05', '10:10', 'inconnu', false, 'rdv'),
      ],
      days: [{ day: '2026-01-05', callbackMinutes: 0 }],
    })
    const r = computeResult(s)
    expect(r.observed.inconnusSansTrace).toBe(1)
    expect(r.partNouveaux).toBeCloseTo(0.5, 5) // 1 nouveau sur 2 appels identifiés
    expect(r.partNouveauxSuppose).toBe(false)
    // haut = (1 + 1 × 0,5) × 21,65 × 0,3 × 100 = 974,25 → 970
    expect(r.euroHaut).toBe(970)
  })

  it('retient l’hypothèse de 30 % de nouveaux quand aucun appel n’est identifié', () => {
    const s = store({
      settings: reglages({ conversionKnown: null, clientValue: 100 }),
      calls: [appel('2026-01-05', '09:40', 'inconnu', false, null)],
      days: [{ day: '2026-01-05', callbackMinutes: 0 }],
    })
    const r = computeResult(s)
    expect(r.partNouveauxSuppose).toBe(true)
    expect(r.partNouveaux).toBe(0.3)
    expect(r.euroBas).toBe(0)
    // haut = 0,3 × 21,65 × 0,3 × 100 = 194,85 → 190
    expect(r.euroHaut).toBe(190)
  })

  it('exclut du calcul les appels des journées non travaillées', () => {
    const s = store({
      settings: reglages({ conversionKnown: 10, clientValue: 100 }),
      calls: [
        appel('2026-01-05', '09:00', 'nouveau', false, 'parti'),
        appel('2026-01-06', '09:00', 'nouveau', false, 'parti'),
      ],
      days: [
        { day: '2026-01-05', callbackMinutes: 60, notWorked: true },
        { day: '2026-01-06', callbackMinutes: 10 },
      ],
    })
    const r = computeResult(s)
    expect(r.joursTravailles).toBe(1)
    expect(r.observed.appels).toBe(1)
    expect(r.minutesNotees).toBe(10)
    // 1 × 21,65 × 1 × 100 = 2 165 → 2 170
    expect(r.euroBas).toBe(2170)
  })

  it('divise la projection quand plusieurs jours sont observés', () => {
    const jours = ['2026-01-05', '2026-01-06', '2026-01-07', '2026-01-08', '2026-01-09']
    const s = store({
      settings: reglages({ conversionKnown: 2, clientValue: 150, workingDays: 6 }),
      calls: jours.map((j) => appel(j, '11:15', 'nouveau', false, 'sans-reponse')),
      days: jours.map((j) => ({ day: j, callbackMinutes: 12 })),
    })
    const r = computeResult(s)
    expect(r.joursTravailles).toBe(5)
    expect(r.projection).toBeCloseTo((6 * 4.33) / 5, 5)
    expect(r.observed.jamaisJoints).toBe(5)
    // 5 × 5,196 × 0,2 × 150 = 779,4 → 780
    expect(r.euroBas).toBe(780)
    expect(r.minutesMois).toBeCloseTo(60 * ((6 * 4.33) / 5), 5)
  })

  it('arrondit les montants à la dizaine d’euros', () => {
    const s = store({
      settings: reglages({ conversionKnown: 10, clientValue: 1 }),
      calls: [appel('2026-01-05', '09:00', 'nouveau', false, 'parti')],
      days: [{ day: '2026-01-05', callbackMinutes: 0 }],
    })
    // 1 × 21,65 × 1 × 1 = 21,65 → 20
    expect(computeResult(s).euroBas).toBe(20)
  })

  it('compte les rendez-vous récupérés quel que soit le type d’appelant', () => {
    const s = store({
      calls: [
        appel('2026-01-05', '09:00', 'nouveau', false, 'rdv'),
        appel('2026-01-05', '09:30', 'client', false, 'rdv'),
      ],
      days: [{ day: '2026-01-05', callbackMinutes: 0 }],
    })
    expect(computeResult(s).observed.rdv).toBe(2)
  })
})

describe('creneauLePlusCharge', () => {
  it('n’affiche rien avant 3 appels', () => {
    expect(creneauLePlusCharge(['09:00', '09:30'])).toBeNull()
  })

  it('retient la tranche de 2 h la plus chargée', () => {
    expect(creneauLePlusCharge(['10:05', '11:45', '08:10', '14:00', '11:00'])).toBe(10)
  })

  it('ignore les heures illisibles', () => {
    expect(creneauLePlusCharge(['', 'midi', '16:10', '17:50', '16:00'])).toBe(16)
  })
})

describe('equivalenceTemps', () => {
  it('donne l’équivalence selon les seuils de 4 h et 8 h', () => {
    expect(equivalenceTemps(120)).toContain('une heure par semaine')
    expect(equivalenceTemps(400)).toContain('une soirée par semaine')
    expect(equivalenceTemps(600)).toContain('plus d’une soirée')
    expect(equivalenceTemps(0)).toBe('')
  })
})

describe('resumeJour', () => {
  it('résume une journée pour l’historique', () => {
    const s = store({
      calls: [
        appel('2026-01-05', '09:00', 'nouveau', false, 'rdv'),
        appel('2026-01-05', '10:00', 'autre'),
        appel('2026-01-06', '10:00', 'nouveau'),
      ],
      days: [{ day: '2026-01-05', callbackMinutes: 30 }],
    })
    expect(resumeJour(s, '2026-01-05')).toEqual({
      day: '2026-01-05',
      appels: 2,
      nouveaux: 1,
      rdv: 1,
      minutes: 30,
      notWorked: false,
    })
  })
})

describe('parseStore', () => {
  it('répare un fichier importé incomplet sans jamais échouer', () => {
    const s = parseStore({
      version: 1,
      settings: { clientValue: -5, conversionKnown: 99, workingDays: 9, profile: 'inexistant' },
      calls: [
        { id: 'x', day: '2026-01-05', time: '09:00', callerType: 'nouveau', followUp: 'bidon' },
        { day: '2026-01-05' },
        null,
      ],
      days: [{ day: '2026-01-05', callbackMinutes: -3 }, 'nope'],
    })
    expect(s.settings?.clientValue).toBe(0)
    expect(s.settings?.conversionKnown).toBeNull()
    expect(s.settings?.workingDays).toBe(5)
    expect(s.settings?.profile).toBeNull()
    expect(s.calls).toHaveLength(1)
    expect(s.calls[0].followUp).toBeNull()
    expect(s.calls[0].leftMessage).toBe(false)
    expect(s.days).toEqual([{ day: '2026-01-05', callbackMinutes: 0 }])
  })

  it('ne casse pas sur une entrée absurde', () => {
    expect(parseStore(null).calls).toEqual([])
    expect(parseStore('bonjour').days).toEqual([])
  })
})
