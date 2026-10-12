# Maison Côte Bleue

## Studio Côte Bleue (`studio/studio-cote-bleue.html`)

Source du dashboard de création publié sur claude.ai : https://claude.ai/artifact/PHdBhtBXs2sjmZ9g7TrFkd

- **Idées** : la routine « Veille quotidienne Maison Côte Bleue » (6h57) dépose chaque info dans la collection `idees`.
- **Idées** : une idée est supprimée le lendemain de son événement (`fin` sinon `quand`) ; filtres À traiter / À vérifier / Utilisées / Écartées, sélection multiple pour un post liste ou un carrousel, et récap du jour (légende, commerces à contacter, texte complet).
- **Atelier** : gabarits de la DA v1 (piste « Mistral », Fredoka + Nunito) en post 4:5 (1080×1350), story 9:16 (1080×1920) et carrousel ; gabarits DA v1 « Agenda semaine », « Agenda week-end », « Agenda du jour », story agenda par village et « Happening » (teaser + compte à rebours) ; légende proposée par Claude, en tutoiement.
- **Calendrier** : 3 posts par semaine, alternance bleu / jaune / photo / nuit / blanc.
- **Analyse** : abonnés, portée, engagement par type et par village, messages reçus.

### Données (base de l'artifact)

| Collection | Contenu |
| --- | --- |
| `idees` | `date, type, village, titre, texte, details, quand, fin, story, sourceNom, sourceUrl, aVerifier, statut, origine, createdAt` |
| `posts` | `format, type, village, pill, sticker, titre, details, legende, datePrevue, source, photoId, ideeId, ideeIds, items[], rows[{date, village, titre, infos, ideeId}], compteur, visuel, villages[], statut, datePublie, stats{portee, likes, commentaires, enregistrements, partages, source}` |
| `recaps` | un document par jour (`AAAA-MM-JJ`) : `date, texte, legende, contacts[{nom, raison, message}]` |
| `stats` | un document par jour (`AAAA-MM-JJ`) : `abonnes, messages, source` |
| `comptes` | un document par compte Instagram pro (`username`) : `nom, village, statut (suivi/propose/ignore), abonnes, dernierPost, raison` |
| `reglages` | `objectifs` (rythme, objectif d'abonnés), `meta` (dernière synchro API Meta) |

Types : `agenda, bonplan, nouveau, pratique, question`. Villages : `couronne, sausset, carry, redonne, cotebleue`.

### Routines du matin

- **6h40 – Instagram Maison Côte Bleue** (environnement cloud « Maison cote bleue ») : API Meta (`graph.facebook.com`, jeton de page stocké comme secret réseau, jamais dans le code) → abonnés, stats des posts, résumé commentaires/mentions, lecture des comptes suivis (Business Discovery), propositions de comptes. Compte Instagram `17841462383522173`, page `1307148845825864`.
- **6h57 – Veille quotidienne** : recherche web, récap du jour, idées, ménage des événements passés, section « Ta communauté Instagram » ; brouillon agenda semaine le lundi, agenda week-end (post + story) le vendredi.

Révoquer l'accès Meta : Facebook → Paramètres → Intégrations professionnelles → Studio Côte Bleue → Supprimer.
