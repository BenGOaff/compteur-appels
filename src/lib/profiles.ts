import type { Profile } from './storage'
import { isProfile } from './storage'

export const CONCLUSIONS: Record<Profile | 'defaut', string> = {
  repondeur:
    'Votre répondeur ne vous montrait que les clients qui laissent un message. Ce compteur vous montre les autres.',
  'rappel-soir':
    'Ces minutes de rappel, ce sont vos soirées. Et une partie des clients rappelés avait déjà trouvé quelqu’un.',
  proche: 'Ces appels, c’est aussi le temps de la personne qui décroche pour vous.',
  telesecretariat:
    'Regardez combien de ces appels se sont terminés par un rendez-vous posé, et combien par un simple message à rappeler.',
  joignable: 'Regardez la part de ces appels qui méritait vraiment de vous interrompre.',
  defaut: 'Voilà ce que coûtent les appels que vous ne pouvez pas prendre.',
}

export const CONCLUSION_COMMUNE =
  'Concierge AI répond quand vous ne pouvez pas décrocher, pose les rendez-vous dans votre agenda et ne vous transfère que les vraies urgences. Vous gardez votre numéro.'

export function conclusionPour(profile: Profile | null): string {
  return profile ? CONCLUSIONS[profile] : CONCLUSIONS.defaut
}

/** Lit ?profil= dans l'URL. Toute valeur hors liste blanche est ignorée. */
export function profileFromUrl(search: string): Profile | null {
  try {
    const value = new URLSearchParams(search).get('profil')
    return isProfile(value) ? value : null
  } catch {
    return null
  }
}
