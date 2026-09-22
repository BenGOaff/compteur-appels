export type CallerType = 'nouveau' | 'client' | 'autre' | 'inconnu'

export type FollowUp =
  | 'rdv' // rendez-vous ou intervention obtenu
  | 'parti' // la personne a trouvé quelqu'un d'autre
  | 'non-pertinent' // hors zone, hors budget, pas pour moi
  | 'sans-reponse' // rappelé, pas de réponse
  | 'a-faire' // pas encore rappelé
  | null

export type MissedCall = {
  id: string
  day: string // AAAA-MM-JJ
  time: string // HH:MM
  callerType: CallerType
  leftMessage: boolean
  followUp: FollowUp
}

export type DayLog = {
  day: string
  callbackMinutes: number
  notWorked?: boolean
}

export type Profile = 'repondeur' | 'rappel-soir' | 'proche' | 'telesecretariat' | 'joignable'

export type Settings = {
  startedAt: string
  clientValue: number
  conversionKnown: number | null
  workingDays: 5 | 6 | 7
  profile: Profile | null
}

export type Store = {
  version: 1
  settings: Settings | null
  calls: MissedCall[]
  days: DayLog[]
}

export const STORAGE_KEY = 'cai-compteur-v1'
const INSTALL_KEY = 'cai-compteur-install-v1'

export const emptyStore = (): Store => ({ version: 1, settings: null, calls: [], days: [] })

function memoryFallback(): Storage | null {
  try {
    const probe = '__cai_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return window.localStorage
  } catch {
    return null
  }
}

let cachedStorage: Storage | null | undefined

function store(): Storage | null {
  if (cachedStorage === undefined) cachedStorage = memoryFallback()
  return cachedStorage
}

export function storageAvailable(): boolean {
  return store() !== null
}

function isCallerType(v: unknown): v is CallerType {
  return v === 'nouveau' || v === 'client' || v === 'autre' || v === 'inconnu'
}

function isFollowUp(v: unknown): v is FollowUp {
  return (
    v === null ||
    v === 'rdv' ||
    v === 'parti' ||
    v === 'non-pertinent' ||
    v === 'sans-reponse' ||
    v === 'a-faire'
  )
}

/** Validation défensive : un fichier importé ou un stockage abîmé ne doit jamais casser l'outil. */
export function parseStore(raw: unknown): Store {
  const base = emptyStore()
  if (!raw || typeof raw !== 'object') return base
  const input = raw as Partial<Store>

  if (input.settings && typeof input.settings === 'object') {
    const s = input.settings as Partial<Settings>
    const workingDays = s.workingDays === 6 ? 6 : s.workingDays === 7 ? 7 : 5
    const conversion =
      typeof s.conversionKnown === 'number' && s.conversionKnown >= 1 && s.conversionKnown <= 10
        ? Math.round(s.conversionKnown)
        : null
    base.settings = {
      startedAt: typeof s.startedAt === 'string' ? s.startedAt : new Date().toISOString(),
      clientValue: typeof s.clientValue === 'number' && s.clientValue >= 0 ? s.clientValue : 0,
      conversionKnown: conversion,
      workingDays,
      profile: isProfile(s.profile) ? s.profile : null,
    }
  }

  if (Array.isArray(input.calls)) {
    base.calls = input.calls.flatMap((c) => {
      if (!c || typeof c !== 'object') return []
      const call = c as Partial<MissedCall>
      if (typeof call.day !== 'string' || typeof call.time !== 'string') return []
      if (!isCallerType(call.callerType)) return []
      return [
        {
          id: typeof call.id === 'string' && call.id ? call.id : newId(),
          day: call.day,
          time: call.time,
          callerType: call.callerType,
          leftMessage: call.leftMessage === true,
          followUp: isFollowUp(call.followUp) ? call.followUp : null,
        },
      ]
    })
  }

  if (Array.isArray(input.days)) {
    base.days = input.days.flatMap((d) => {
      if (!d || typeof d !== 'object') return []
      const day = d as Partial<DayLog>
      if (typeof day.day !== 'string') return []
      return [
        {
          day: day.day,
          callbackMinutes:
            typeof day.callbackMinutes === 'number' && day.callbackMinutes >= 0
              ? Math.round(day.callbackMinutes)
              : 0,
          ...(day.notWorked === true ? { notWorked: true as const } : {}),
        },
      ]
    })
  }

  return base
}

export function isProfile(value: unknown): value is Profile {
  return (
    value === 'repondeur' ||
    value === 'rappel-soir' ||
    value === 'proche' ||
    value === 'telesecretariat' ||
    value === 'joignable'
  )
}

export function loadStore(): Store {
  const s = store()
  if (!s) return emptyStore()
  try {
    const raw = s.getItem(STORAGE_KEY)
    if (!raw) return emptyStore()
    return parseStore(JSON.parse(raw))
  } catch {
    return emptyStore()
  }
}

export function saveStore(value: Store): void {
  const s = store()
  if (!s) return
  try {
    s.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    /* stockage plein ou refusé : l'outil continue de fonctionner en mémoire */
  }
}

let persistenceAsked = false

/** Demande au navigateur de ne pas effacer les données automatiquement. */
export function askPersistence(): void {
  if (persistenceAsked) return
  persistenceAsked = true
  try {
    void navigator.storage?.persist?.()
  } catch {
    /* non supporté : sans conséquence */
  }
}

export function installHintSeen(): boolean {
  const s = store()
  if (!s) return true
  try {
    return s.getItem(INSTALL_KEY) === '1'
  } catch {
    return true
  }
}

export function markInstallHintSeen(): void {
  const s = store()
  if (!s) return
  try {
    s.setItem(INSTALL_KEY, '1')
  } catch {
    /* sans conséquence */
  }
}

export function clearStore(): void {
  const s = store()
  if (!s) return
  try {
    s.removeItem(STORAGE_KEY)
    s.removeItem(INSTALL_KEY)
  } catch {
    /* sans conséquence */
  }
}

export function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  } catch {
    /* repli ci-dessous */
  }
  return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
