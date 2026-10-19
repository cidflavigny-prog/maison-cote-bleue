# Maison Côte Bleue

Média local Instagram de la Côte Bleue (La Couronne-Carro, Sausset-les-Pins, Carry-le-Rouet, Ensuès-la-Redonne).
Direction artistique v1 : piste « Mistral », Fredoka + Nunito, une couleur par village, touche années 90.

## Studio Côte Bleue

Page de travail publiée sur claude.ai (privée) : https://claude.ai/artifact/PHdBhtBXs2sjmZ9g7TrFkd

- **Accueil (Semaine)** : bandeau « Que veux-tu créer aujourd’hui ? » avec un raccourci rond par gabarit, puis les rendez-vous fixes et leur état (à créer, prêt à vérifier, publié).
  - chaque matin vers 7h : story météo du lendemain, à programmer pour 18h ;
  - dimanche : agenda de la semaine suivante (post), plus une story « Ça bouge à … » pour chaque village qui a au moins 3 événements ;
  - jeudi : agenda du week-end (post + story).
- **Idées** : infos déposées par la veille, filtres À traiter / À vérifier / Utilisées / Écartées, sélection → agenda, récap du jour, veille réseaux du jour, comptes à suivre et à contacter (avec message prêt à copier).
- **Atelier** (éditeur façon Canva : réglages à gauche, plan de travail à droite avec format et téléchargement) : gabarits de la DA (agenda semaine, week-end, du jour, météo, événement, bon plan, nouveauté, info pratique, question, happening) en post 4:5 (1080×1350), story 9:16 (1080×1920) et carrousel (couverture, une slide par événement ou par ligne de détails, slide de fin ; 10 slides maximum), photos encadrées (contour marine, ombre dure, fond de couleur conservé), légende proposée par Claude.
- **Com** : le Point com du lundi (bilan, calendrier, conseils, relances), l'état de chaque routine et un journal où les routines notent publications, échecs et vérifications (`reglages/strategie.journal`).
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
| `posts` | `format, type, village, pill, sticker, titre, details, legende, datePrevue, source, photoId, rows[{date, village, titre, infos, ideeId, photoId}], planif{date, heure, at, statut (programme/en_cours/publie/erreur/annule), assetId, format, erreur}, compteur, visuel, villages[], meteoDate, statut, datePublie, stats, auto` | brouillon (non publié) dès que sa date est passée : date prévue, dernière ligne d’agenda ou jour de la météo |
| `recaps` | un document par jour : `texte, legende, contacts[]` | seul celui du jour est gardé |
| `meteo` | un document par jour (`AAAA-MM-JJ`) : `villages{code, tmin, tmax}, mer{eau, eauVeille, vagues, vent, rafales, dir}` (valeur mer absente = colonne masquée ; `eauVeille` = eau reprise de la veille, affichée « ≈ ») | supprimé le jour passé |
| `stats` | un document par jour : `abonnes, messages` | — |
| `comptes` | comptes pros Instagram et Facebook : `plateforme, url, statut (suivi/propose/ignore), action, message, contacteLe, village, abonnes, dernierPost` | — |
| `reglages` | `objectifs`, `meta` (bilan des routines), `reseaux` (hashtags, tendances, publications du jour), `strategie` (Point com du lundi) | — |

## Ligne éditoriale

Décision d'Océane (19 octobre 2026), valable jusqu'à nouvel ordre de sa part : **aucun contenu politique** (réunions publiques, conseils municipaux, maire et élus, campagnes, élections). Priorité aux sorties, soirées, jeux, lotos, dégustations, promos et nouveautés des commerces, restaurants, bars, associations et lieux de loisirs. L'organisation municipale (déchets, démarches, travaux) passe en dernier, seulement pour une alerte vraiment utile.

## Routines

| Heure | Routine | Environnement |
| --- | --- | --- |
| Dim, mar, jeu 6h47 | Veille : publications des comptes pros via l'API Meta, hashtags, tendances, recherche web, récap, idées, ménage ; brouillons d'agenda le dimanche (semaine) et le jeudi (week-end), plus 2 idées de sortie le jeudi | « Maison cote bleue » (jeton Meta en secret réseau pour `graph.facebook.com`) |
| Lundi 7h20 | Recherche de comptes Instagram et Facebook à suivre ou contacter, avec message proposé | « Maison cote bleue » |
| Lundi 8h12 | Point com : chiffres Meta, bilan de la semaine, calendrier éditorial, conseils, relances, santé des routines → `reglages/strategie` (onglet Semaine → Point com) | « Maison cote bleue » |
| 8h01, 12h01, 18h01, 20h01 | Publication programmée : publie sur Instagram (story ou post) les visuels programmés depuis l'atelier (bouton « Programmer »). L'image est déposée dans le studio, mise en ligne sur la page Facebook en photo non publiée, puis publiée via l'API Instagram. Besoin des autorisations `instagram_content_publish` et `pages_manage_posts` sur le jeton | « Maison cote bleue » |
| 7h04 chaque jour | Météo de demain (Open-Meteo, mer avec réserve sur 3 jours) → story à télécharger et programmer pour 18h | « Maison cote bleue » |
| — | Anciennes routines en pause : veille quotidienne Cowork, stats Instagram quotidiennes (reprises dans le Point com) | — |

Compte Instagram `17841462383522173`, page Facebook `1307148845825864`.
Révoquer l'accès Meta : Facebook → Paramètres → Intégrations professionnelles → Studio Côte Bleue → Supprimer.
