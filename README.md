# Maison Côte Bleue

## Studio Côte Bleue (`studio/studio-cote-bleue.html`)

Source du dashboard de création publié sur claude.ai : https://claude.ai/artifact/PHdBhtBXs2sjmZ9g7TrFkd

- **Idées** : la routine « Veille quotidienne Maison Côte Bleue » (6h57) dépose chaque info dans la collection `idees`.
- **Atelier** : gabarits de la DA v1 (piste « Mistral », Fredoka + Nunito) en post 4:5 (1080×1350) et story 9:16 (1080×1920) ; légende proposée par Claude, en tutoiement.
- **Calendrier** : 3 posts par semaine, alternance bleu / jaune / photo / nuit / blanc.
- **Analyse** : abonnés, portée, engagement par type et par village, messages reçus.

### Données (base de l'artifact)

| Collection | Contenu |
| --- | --- |
| `idees` | `date, type, village, titre, texte, details, quand, story, sourceNom, sourceUrl, aVerifier, statut, origine, createdAt` |
| `posts` | `format, type, village, pill, sticker, titre, details, legende, datePrevue, source, photoId, ideeId, statut, datePublie, stats{portee, likes, commentaires, enregistrements, partages, source}` |
| `stats` | un document par jour (`AAAA-MM-JJ`) : `abonnes, messages, source` |
| `reglages` | `objectifs` (rythme, objectif d'abonnés), `meta` (dernière synchro API Meta) |

Types : `agenda, bonplan, nouveau, pratique, question`. Villages : `couronne, sausset, carry, redonne, cotebleue`.
