import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/** §1 du brief : ces mots ne doivent jamais apparaître dans l'interface. */
const INTERDITS = [
  /\bIA\b/,
  /intelligence artificielle/i,
  /agents? vocaux?|agent vocal/i,
  /\bprospects?\b/i,
  /\bleads?\b/i,
  /\bdashboards?\b/i,
  /\bworkflows?\b/i,
  /\bonboarding\b/i,
]

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom)
    if (statSync(chemin).isDirectory()) return fichiers(chemin)
    if (!/\.(tsx|ts|css|html)$/.test(chemin)) return []
    if (/\.test\.ts$/.test(chemin)) return []
    return [chemin]
  })
}

describe('vocabulaire de l’interface', () => {
  it('n’emploie aucun des mots interdits', () => {
    const fautes: string[] = []
    for (const chemin of [...fichiers('src'), 'appels/index.html', 'index.html']) {
      const contenu = readFileSync(chemin, 'utf8')
      for (const motif of INTERDITS) {
        const trouve = motif.exec(contenu)
        if (trouve) fautes.push(`${chemin} : « ${trouve[0]} »`)
      }
    }
    expect(fautes).toEqual([])
  })

  it('n’ouvre jamais une boîte de dialogue native du navigateur', () => {
    for (const chemin of fichiers('src')) {
      expect(readFileSync(chemin, 'utf8')).not.toMatch(/window\.confirm|\bconfirm\(/)
    }
  })
})
