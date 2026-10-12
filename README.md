# Maison Côte Bleue

Média local Instagram de la Côte Bleue (La Couronne-Carro, Sausset-les-Pins, Carry-le-Rouet, Ensuès-la-Redonne).
Direction artistique v1 : piste « Mistral », Fredoka + Nunito, une couleur par village, touche années 90.

## Studio Côte Bleue

Page de travail publiée sur claude.ai (privée) : https://claude.ai/artifact/PHdBhtBXs2sjmZ9g7TrFkd

- **Semaine** : les rendez-vous fixes et leur état (à créer, prêt à vérifier, publié).
  - chaque soir 18h : story météo du lendemain ;
  - dimanche : agenda de la semaine suivante (post), plus une story « Ça bouge à … » pour chaque village qui a au moins 3 événements ;
  - jeudi : agenda du week-end (post + story).
- **Idées** : infos déposées par la veille, filtres À traiter / À vérifier / Utilisées / Écartées, sélection → agenda, récap du jour, comptes Instagram suivis.
- **Atelier** : gabarits de la DA (agenda semaine, week-end, du jour, météo, événement, bon plan, nouveauté, info pratique, question, happening) en post 4:5 (1080×1350) et story 9:16 (1080×1920), photos encadrées (contour marine, ombre dure, fond de couleur conservé), légende proposée par Claude.
- **Stats** : abonnés, portée, engagement par gabarit et par village (API Meta).

### Code

`studio/src/` contient les sources, `python3 studio/build.py` reconstruit `studio/studio-cote-bleue.html`, qui est publié tel quel.

| Fichier | Rôle |
| --- | --- |
| `src/gabarits.js` | Marque, dates, rendu canvas de tous les gabarits |
| `src/interface.js` | Écrans, base de données, ménage automatique |
| `src/body.html`, `src/styles.css` | Structure et styles de la page |

### Données (base de l'artifact)

| Collection | Contenu | Ménage |
| --- | --- | --- |
| `idees` | `date, type, village, titre, texte, details, quand, fin, story, sourceNom, sourceUrl, aVerifier, statut, origine` | supprimée le lendemain de `fin` (sinon `quand`) ; sans date : après 14 jours |
| `posts` | `format, type, village, pill, sticker, titre, details, legende, datePrevue, source, photoId, rows[{date, village, titre, infos, ideeId, photoId}], compteur, visuel, villages[], meteoDate, statut, datePublie, stats, auto` | brouillon dont la date est passée depuis 7 jours |
| `recaps` | un document par jour : `texte, legende, contacts[]` | seul celui du jour est gardé |
| `meteo` | un document par jour (`AAAA-MM-JJ`) : `villages{code, tmin, tmax}, mer{eau, vagues, vent, rafales, dir}` | supprimé le jour passé |
| `stats` | un document par jour : `abonnes, messages` | — |
| `comptes` | comptes Instagram pros : `statut (suivi/propose/ignore), village, abonnes, dernierPost` | — |
| `reglages` | `objectifs`, `meta` (bilan des routines) | — |

## Routines

| Heure | Routine | Environnement |
| --- | --- | --- |
| 6h40 | Instagram : abonnés, stats des posts, communauté, comptes suivis | « Maison cote bleue » (jeton Meta en secret réseau pour `graph.facebook.com`) |
| 6h57 | Veille : recherche web, récap, idées, ménage, brouillons d'agenda le dimanche et le jeudi | Cowork |
| 17h30 | Météo de demain (Open-Meteo) → story du soir | « Maison cote bleue » (domaines `api.open-meteo.com` et `marine-api.open-meteo.com` à autoriser) |

Compte Instagram `17841462383522173`, page Facebook `1307148845825864`.
Révoquer l'accès Meta : Facebook → Paramètres → Intégrations professionnelles → Studio Côte Bleue → Supprimer.
