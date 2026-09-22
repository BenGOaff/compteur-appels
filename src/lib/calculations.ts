import type { Store } from './storage'

export const MONTH_WEEKS = 4.33
export const DEFAULT_PART_NOUVEAUX = 0.3
export const DEFAULT_RATE_LOW = 0.1
export const DEFAULT_RATE_HIGH = 0.3

export type Observed = {
  appels: number
  nouveaux: number
  sansMessage: number
  perdusConfirmes: number
  jamaisJoints: number
  rdv: number
  inconnusSansTrace: number
}

export type Result = {
  joursTravailles: number
  projection: number
  observed: Observed
  partNouveaux: number
  partNouveauxSuppose: boolean
  tauxConnu: boolean
  tauxBas: number
  tauxHaut: number
  euroBas: number
  euroHaut: number
  aucunePerte: boolean
  minutesMois: number
  minutesNotees: number
  equivalenceTemps: string
  creneauCharge: number | null
}

/** Jours réellement observés : ceux qui portent des appels ou qui ont été ouverts, sauf les jours non travaillés. */
export function joursTravailles(store: Store): string[] {
  const exclus = new Set(store.days.filter((d) => d.notWorked).map((d) => d.day))
  const jours = new Set<string>()
  for (const day of store.days) if (!day.notWorked) jours.add(day.day)
  for (const call of store.calls) if (!exclus.has(call.day)) jours.add(call.day)
  return [...jours].sort()
}

export function appelsRetenus(store: Store) {
  const exclus = new Set(store.days.filter((d) => d.notWorked).map((d) => d.day))
  return store.calls.filter((c) => !exclus.has(c.day))
}

/** Arrondi à la dizaine, stabilisé pour que 6 494,999… (erreur de virgule flottante) donne bien 6 500. */
function roundToTen(value: number): number {
  const stable = Math.round(value * 1e6) / 1e6
  return Math.round(stable / 10) * 10
}

export function equivalenceTemps(minutesMois: number): string {
  if (minutesMois <= 0) return ''
  if (minutesMois < 240) return 'soit environ une heure par semaine'
  if (minutesMois <= 480) return 'soit environ une soirée par semaine'
  return 'soit plus d\u2019une soirée par semaine'
}

/** Tranche de 2 h qui concentre le plus d'appels. null avant 3 appels horodatés. */
export function creneauLePlusCharge(times: string[]): number | null {
  const heures = times
    .map((t) => /^(\d{1,2}):(\d{2})$/.exec(t))
    .flatMap((m) => (m ? [Number(m[1])] : []))
    .filter((h) => h >= 0 && h <= 23)
  if (heures.length < 3) return null
  const tranches = new Map<number, number>()
  for (const h of heures) {
    const debut = Math.floor(h / 2) * 2
    tranches.set(debut, (tranches.get(debut) ?? 0) + 1)
  }
  let meilleur: number | null = null
  let max = 0
  for (const [debut, total] of [...tranches.entries()].sort((a, b) => a[0] - b[0])) {
    if (total > max) {
      max = total
      meilleur = debut
    }
  }
  return meilleur
}

export function computeResult(store: Store): Result {
  const jours = joursTravailles(store)
  const J = jours.length
  const calls = appelsRetenus(store)
  const settings = store.settings

  const workingDays = settings?.workingDays ?? 5
  const clientValue = settings?.clientValue ?? 0
  const projection = J > 0 ? (workingDays * MONTH_WEEKS) / J : 0

  const nouveaux = calls.filter((c) => c.callerType === 'nouveau').length
  const clients = calls.filter((c) => c.callerType === 'client').length
  const autres = calls.filter((c) => c.callerType === 'autre').length
  const perdusConfirmes = calls.filter((c) => c.callerType === 'nouveau' && c.followUp === 'parti').length
  const jamaisJoints = calls.filter(
    (c) =>
      c.callerType === 'nouveau' &&
      (c.followUp === 'sans-reponse' || c.followUp === 'a-faire' || c.followUp === null),
  ).length
  const rdv = calls.filter((c) => c.followUp === 'rdv').length
  const inconnusSansTrace = calls.filter(
    (c) => c.callerType === 'inconnu' && !c.leftMessage && c.followUp !== 'rdv',
  ).length

  const denominateur = nouveaux + clients + autres
  const partNouveauxSuppose = denominateur === 0
  const partNouveaux = partNouveauxSuppose ? DEFAULT_PART_NOUVEAUX : nouveaux / denominateur

  const tauxConnu = typeof settings?.conversionKnown === 'number'
  const tauxBas = tauxConnu ? (settings as { conversionKnown: number }).conversionKnown / 10 : DEFAULT_RATE_LOW
  const tauxHaut = tauxConnu ? tauxBas : DEFAULT_RATE_HIGH

  const perdus = perdusConfirmes + jamaisJoints
  const euroBas = roundToTen(perdus * projection * tauxBas * clientValue)
  const euroHaut = roundToTen(
    (perdus + inconnusSansTrace * partNouveaux) * projection * tauxHaut * clientValue,
  )

  const minutesNotees = store.days
    .filter((d) => !d.notWorked)
    .reduce((total, d) => total + (d.callbackMinutes || 0), 0)
  const minutesMois = minutesNotees * projection

  return {
    joursTravailles: J,
    projection,
    observed: {
      appels: calls.length,
      nouveaux,
      sansMessage: calls.filter((c) => !c.leftMessage).length,
      perdusConfirmes,
      jamaisJoints,
      rdv,
      inconnusSansTrace,
    },
    partNouveaux,
    partNouveauxSuppose,
    tauxConnu,
    tauxBas,
    tauxHaut,
    euroBas: Math.max(0, euroBas),
    euroHaut: Math.max(0, Math.max(euroBas, euroHaut)),
    aucunePerte: perdus === 0 && inconnusSansTrace === 0,
    minutesMois,
    minutesNotees,
    equivalenceTemps: equivalenceTemps(minutesMois),
    creneauCharge: creneauLePlusCharge(calls.map((c) => c.time)),
  }
}

/** Résumé d'une journée pour l'historique. */
export function resumeJour(store: Store, day: string) {
  const calls = store.calls.filter((c) => c.day === day)
  const log = store.days.find((d) => d.day === day)
  return {
    day,
    appels: calls.length,
    nouveaux: calls.filter((c) => c.callerType === 'nouveau').length,
    rdv: calls.filter((c) => c.followUp === 'rdv').length,
    minutes: log?.callbackMinutes ?? 0,
    notWorked: log?.notWorked === true,
  }
}
