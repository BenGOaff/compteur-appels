# Le compteur des appels manqués

Outil web mobile, gratuit et sans compte, offert aux personnes qui terminent le quiz de
[concierge-ai.fr](https://www.concierge-ai.fr). Pendant 5 jours de travail, l'utilisateur note les appels
qu'il n'a pas pu prendre. L'outil calcule ensuite ce qu'ils représentent chaque mois, en chiffre
d'affaires et en temps passé à rappeler.

**Adresse de production :** `https://outil.concierge-ai.fr/appels`

## Ce qui est garanti

- Aucune donnée personnelle collectée, aucun compte, aucun email.
- Tout est enregistré sur l'appareil de l'utilisateur (`localStorage`), rien n'est envoyé à un serveur.
- Aucun cookie, aucun traceur. Les seules requêtes sortantes sont les fichiers de l'outil et Google Fonts.
- Installable sur l'écran d'accueil et utilisable hors connexion.

## Mise en ligne (Hostinger Web Apps)

| Réglage | Valeur |
| --- | --- |
| Dépôt | `BenGOaff/compteur-appels` |
| Branche | `main` |
| Framework | Vite |
| Commande d'installation | `npm install` |
| Commande de build | `npm run build` |
| Dossier de sortie | `dist` |
| Domaine | `outil.concierge-ai.fr` (avec SSL) |

Chaque envoi sur `main` reconstruit et remet l'outil en ligne automatiquement.

À vérifier après la première mise en ligne : `/appels`, `/appels?profil=proche`, un rechargement de page,
et l'ouverture hors connexion une fois l'outil ajouté à l'écran d'accueil.

Si Web Apps pose problème, le dossier `dist/` peut être déposé tel quel sur un hébergement classique :
le fichier `.htaccess` inclus force le HTTPS et fait fonctionner l'adresse `/appels`.

## Le lien à envoyer

`https://outil.concierge-ai.fr/appels?profil=XXX` où `XXX` personnalise la phrase de conclusion :

| Paramètre | Profil du répondant |
| --- | --- |
| `repondeur` | laisse le répondeur prendre les appels |
| `rappel-soir` | rappelle le soir |
| `proche` | un proche décroche pour lui |
| `telesecretariat` | passe par un télésecrétariat |
| `joignable` | décroche toujours |

Sans paramètre, l'outil fonctionne avec un texte générique. Une valeur inconnue est simplement ignorée.

## Pour développer

```bash
npm install      # installer
npm run dev      # travailler en local
npm test         # lancer les tests de calcul
npm run build    # produire le dossier dist/
npm run preview  # vérifier le résultat du build
```

## Organisation du code

```
src/
  App.tsx                    enchaînement des écrans, enregistrement, onglets
  screens/Welcome.tsx        accueil (premier lancement)
  screens/Setup.tsx          les 3 questions de réglage
  screens/Today.tsx          écran principal du jour
  screens/History.tsx        historique, export, import, impression
  screens/Result.tsx         estimation mensuelle et conclusion
  components/                feuille d'ajout, carte d'appel, invitation à installer…
  lib/storage.ts             lecture et écriture sur l'appareil (tolérantes aux pannes)
  lib/calculations.ts        tous les calculs, testés
  lib/profiles.ts            phrases de conclusion par profil
  lib/format.ts              formats français (euros, heures, dates)
```
