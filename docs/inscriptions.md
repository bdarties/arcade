# Inscriptions et cloisonnement des équipes (SAÉ 301)

Ce document décrit le dispositif qui donne aux étudiant·es l'accès en écriture
au dépôt, et qui les empêche de modifier le dossier d'une autre équipe.

Il s'adresse aux enseignant·es. Les étudiant·es, eux, n'ont qu'une chose à
faire : ouvrir une demande d'inscription depuis l'onglet **Issues**.

---

## 1. Vue d'ensemble

Tout tient dans ce dépôt, `bdarties/arcade`. Il n'y a pas de second dépôt :
le formulaire d'inscription, le robot qui le traite, la liste des équipes et
les dossiers de jeu cohabitent.

```
  Étudiant·e
      │
      │  ouvre une demande (onglet Issues → « Inscription à une équipe de jeu »)
      ▼
  .github/ISSUE_TEMPLATE/inscription.yml
      │  choisit son jeu dans une liste déroulante
      ▼
  .github/workflows/inscription.yml        ← robot, déclenché aussitôt
      │
      ├─ répond dans la demande, puis la ferme
      ├─ inscrit le pseudo dans .github/groupes.json  (commit sur main)
      └─ envoie l'invitation de collaboration (droit « push »)
      │
      ▼
  L'étudiant·e accepte l'invitation, clone, travaille dans games/2026/<jeu>/
      │
      │  ouvre une Pull Request vers main
      ▼
  .github/workflows/verifier_dossiers.yml  ← robot, sur chaque PR
      │
      └─ refuse la PR si elle touche un fichier hors de games/2026/<jeu>/
```

Deux remarques qui expliquent la forme du dispositif :

- **Le pseudo GitHub n'est jamais saisi à la main.** Le robot lit
  `github.event.issue.user.login`, c'est-à-dire le compte réellement connecté.
  Une faute de frappe est donc impossible, et personne ne peut s'inscrire à la
  place d'un·e autre.
- **La dernière demande fait foi.** Un·e étudiant·e qui s'est trompé·e d'équipe
  ouvre simplement une seconde demande : le robot le retire de partout avant de
  l'ajouter à la bonne équipe. Aucune intervention n'est nécessaire.

---

## 2. Les fichiers, un par un

### `.github/ISSUE_TEMPLATE/inscription.yml`

Le formulaire. Une liste déroulante (les 8 jeux) et une case à cocher de
confirmation. Le titre est forcé à « Inscription » et l'étiquette
`inscription` est posée automatiquement — c'est elle que le robot surveille.

> **L'étiquette `inscription` doit exister dans le dépôt.** La documentation
> GitHub est explicite : *« If a label does not already exist in the
> repository, it will not be automatically added to the issue. »* Si elle
> manque, la demande s'ouvre sans étiquette, le robot ne se déclenche pas et
> il ne se passe **rien** — sans le moindre message d'erreur. Elle a été créée
> le 28 septembre 2026 ; à recréer si elle venait à disparaître :
>
> ```bash
> gh api --method POST repos/bdarties/arcade/labels \
>   -f name=inscription -f color=0E8A16 \
>   -f description="Demande d'accès en écriture à un dossier de jeu"
> ```

La liste déroulante est volontairement fermée : elle interdit les fautes de
frappe et les noms d'équipe inventés.

### `.github/workflows/inscription.yml`

Le robot d'inscription. Il se déclenche à l'ouverture, à la modification **et
à l'étiquetage** d'une demande portant l'étiquette `inscription`, et enchaîne
cinq étapes :

| Étape | Ce qu'elle fait | Condition |
|---|---|---|
| Lire le jeu déclaré | extrait le jeu du corps de la demande, vérifie qu'il existe | toujours |
| Repérer une demande déjà traitée | compte les réponses déjà postées par le robot | toujours |
| Répondre à l'étudiant·e | poste un commentaire, ferme la demande si elle est valide | demande modifiée **ou** jamais répondue |
| Inscrire dans `groupes.json` | met à jour le fichier et pousse sur `main` | demande valide **et** jeton présent |
| Inviter comme collaborateur | envoie l'invitation en écriture | demande valide **et** jeton présent |

La mise à jour de `groupes.json` est **incrémentale** : le robot lit le
fichier, retire le pseudo de toutes les équipes, puis l'ajoute à la bonne.
Il n'écrase donc jamais le travail d'une inscription précédente.

```python
# 1. Une personne n'appartient qu'à une seule équipe : on la retire
#    partout avant de l'ajouter, ce qui rend les corrections gratuites.
for k in groupes:
    groupes[k] = [m for m in groupes[k] if m.lower() != auteur.lower()]
```

### `.github/workflows/verifier_dossiers.yml`

Le gendarme. Sur chaque Pull Request vers `main`, il compare les fichiers
modifiés au dossier attribué à l'auteur de la PR, et échoue si quoi que ce
soit dépasse.

Les enseignant·es (`bdarties`, `DamienMarill`, `nico3807`) sont exemptés.
Pour ajouter un·e collègue, modifiez la liste `enseignants` dans ce fichier.

Avant tout cela, une première étape relit `.github/groupes.json` et refuse la
Pull Request s'il est mal formé : JSON invalide, clé qui ne ressemble pas à
`games/2026/<jeu>/`, valeur qui n'est pas une liste de chaînes, ou pseudo
inscrit dans deux équipes à la fois. **Cette étape-là ne connaît pas
d'exemption**, et c'est tout l'intérêt : l'exemption des enseignant·es rend la
main avant que `groupes.json` ne soit ouvert, si bien qu'une retouche manuelle
maladroite passait au vert sur une PR d'enseignant·e — pour ensuite casser les
**deux** robots, pour toute la promotion, dès qu'elle arrivait sur `main`.
Le cas s'est présenté : un pseudo ajouté à la main sans guillemets,
`[cocolas007-ui]` au lieu de `["cocolas007-ui"]`.

### `.github/groupes.json`

La liste des équipes. C'est le seul état du dispositif.

```json
{
  "games/2026/arianite/": [],
  "games/2026/artemis/": []
}
```

**Le `/` final des clés n'est pas décoratif.** Le gendarme teste
`fichier.startswith(dossier_permis)` : sans lui, `games/2026/maestro/` serait
aussi autorisé à écrire dans un hypothétique `games/2026/maestro_bis/`.

Le préfixe `games/2026/` a un effet de bord heureux : `games/2025/` et
`games/demos/` ne correspondent à aucune clé, ils sont donc interdits à tout
le monde sans qu'on ait eu à l'écrire nulle part.

**Pour ajouter ou renommer une équipe**, il suffit de toucher deux fichiers :
ce `groupes.json` et la liste déroulante du formulaire. Les deux robots
déduisent la liste des jeux valides des clés de `groupes.json`.

### `outils/inscrire.py`

Un filet de sécurité, à utiliser depuis un poste d'enseignant·e. Il relit
toutes les demandes d'un coup, reconstruit `groupes.json` et envoie les
invitations manquantes. Il sert quand le robot n'a pas pu tourner — jeton
expiré, secret absent, Actions désactivées.

```bash
python outils/inscrire.py              # simulation : n'écrit rien
python outils/inscrire.py --appliquer  # écrit et invite pour de vrai
```

> **Attention** : ce script **reconstruit** `groupes.json`, il ne le complète
> pas. Une personne ajoutée à la main sans demande correspondante en
> disparaîtrait. Le script signale explicitement ces pseudos avant d'agir ;
> lisez toujours la simulation.

---

## 3. Ce que `bdarties` doit mettre en place

Le dispositif est inerte tant que ces trois réglages ne sont pas faits. Ils
demandent les droits d'administration du dépôt, que seul `bdarties` possède.

### 3.1 Créer le jeton

`GITHUB_TOKEN`, le jeton automatique des Actions, ne sait **ni** ajouter un
collaborateur **ni** franchir une protection de branche. Il faut donc un jeton
personnel appartenant à un compte administrateur.

1. <https://github.com/settings/personal-access-tokens/new>
   (*Settings → Developer settings → Personal access tokens → Fine-grained*)
2. **Resource owner** : `bdarties`
3. **Repository access** : *Only select repositories* → `bdarties/arcade`
4. **Repository permissions** :
   - **Contents** → *Read and write* (pour pousser `groupes.json`)
   - **Administration** → *Read and write* (pour inviter les collaborateurs)
   - **Issues** → *Read and write* (commenter et fermer les demandes)
5. **Expiration** : au-delà de la fin de la SAÉ. Le jour où il expire, le robot
   cesse de fonctionner **en silence** : les demandes reçoivent toujours une
   réponse, mais plus aucune invitation ne part.

### 3.2 Enregistrer le jeton comme secret

*Settings → Secrets and variables → Actions → New repository secret*

| Nom | Valeur |
|---|---|
| `TOKEN_INSCRIPTIONS` | le jeton créé ci-dessus |

Le nom compte : le robot le cherche sous ce nom exact, et se contente d'une
réponse polie sans invitation tant qu'il ne le trouve pas. Le dispositif peut
donc être publié avant que le secret existe, sans rien casser.

### 3.3 Protéger la branche `main`

*Settings → Branches → Add branch protection rule*, motif `main` :

| Réglage | Valeur | Pourquoi |
|---|---|---|
| Require a pull request before merging | ✅ | sinon le cloisonnement ne sert à rien : on pousse directement |
| Required approving reviews | 1 | une relecture par l'équipe |
| Require status checks to pass | ✅ `verifier-acces` | c'est le gendarme |
| Require branches to be up to date | ✅ | évite de valider sur une base périmée |
| **Do not allow bypassing the above settings** | ❌ **décoché** | **critique** — voir ci-dessous |
| Allow force pushes | ❌ | |
| Allow deletions | ❌ | |

> **Le réglage « Do not allow bypassing » doit rester décoché.** Il correspond
> à `enforce_admins: true`. Activé, il empêche aussi le jeton d'administration
> de pousser sur `main` — le robot d'inscription échouerait à chaque demande.

Le même réglage en ligne de commande :

```bash
gh api --method PUT repos/bdarties/arcade/branches/main/protection \
  --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["verifier-acces"] },
  "enforce_admins": false,
  "required_pull_request_reviews": { "required_approving_review_count": 1 },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

### 3.4 Vérifier que tout marche

Une fois les trois réglages faits, ouvrez vous-même une demande
d'inscription depuis l'onglet Issues. En moins d'une minute vous devriez voir :
une réponse dans la demande, la demande fermée, un commit « Inscrit … » sur
`main`, et votre pseudo dans `groupes.json`.

---

## 4. Détails de conception qui ne se devinent pas

- **Le contexte `secrets` n'est pas lisible depuis un `if:`.** Ni sur un job,
  ni sur une étape. C'est pourquoi la présence du jeton transite par une
  sortie d'étape (`$GITHUB_OUTPUT`) et non par une simple condition.
- **Le corps d'une demande est écrit par n'importe qui sur Internet.** Ce dépôt
  est public. Le corps ne doit donc jamais être interpolé directement dans un
  script shell : il transite par une variable d'environnement (`CORPS`).
  Interpolé, `${{ github.event.issue.body }}` permettrait une injection de
  commandes avec les droits du robot.
- **`persist-credentials: false` au checkout.** Le jeton du checkout ne sert
  qu'à lire ; le push se fait ensuite explicitement avec le jeton personnel,
  seul capable de franchir la protection de branche.
- **`concurrency: inscription-arcade`.** Les inscriptions arrivent toutes dans
  le même quart d'heure. Sans cette file d'attente, deux exécutions
  simultanées pousseraient sur `main` en même temps et la seconde serait
  rejetée. Elle sert aussi de garantie au garde-fou ci-dessous : quand une
  exécution démarre, la précédente est forcément terminée, donc son
  commentaire est déjà visible.
- **Le déclencheur `labeled` fait tourner le robot deux fois par inscription.**
  Le formulaire pose l'étiquette au moment même de la création : GitHub émet
  donc `opened` **et** `labeled` pour une seule demande — on le voit dans la
  chronologie de n'importe quelle inscription, où l'évènement `labeled` porte
  la seconde exacte de la création. Sans précaution, chaque étudiant·e
  recevrait deux fois la même réponse. D'où l'étape « Repérer une demande déjà
  traitée » : le robot ne répond que si aucune réponse n'existe encore, sauf
  lorsque la demande vient d'être modifiée — auquel cas une nouvelle réponse
  est justement ce qu'on veut.
- **`github.event.pull_request.user.login`, pas `github.actor`.** Le second
  désigne la dernière personne ayant poussé sur la branche : si un·e
  enseignant·e poussait un correctif sur la branche d'un·e étudiant·e, la
  vérification serait entièrement contournée.
- **`PYTHONIOENCODING: utf-8`.** Sans cette variable, les accents des messages
  produits par les scripts Python en ligne sortent mal encodés.
- **Les pseudos fictifs `pseudo_etudiant1`, `pseudo_etudiant2`…** sont retirés
  automatiquement d'une équipe dès qu'une vraie personne s'y déclare. Ils
  servent uniquement à documenter le format du fichier.

---

## 5. Exploitation courante

| Symptôme | Cause probable | Geste |
|---|---|---|
| La demande reçoit « Votre enseignant·e vous enverra l'invitation » | le secret `TOKEN_INSCRIPTIONS` est absent ou vide | §3.2 |
| La demande reste ouverte, aucun commentaire, exécution `skipped` | l'étiquette `inscription` n'existe plus dans le dépôt : le formulaire ne peut donc pas la poser, et le `if:` du robot ne trouve rien | la recréer (§2, `inscription.yml`), puis poser l'étiquette sur les demandes en attente — le déclencheur `labeled` les rattrapera |
| La demande reste ouverte, aucun commentaire | demande écrite à la main, donc sans étiquette | poser l'étiquette `inscription` dessus, ou demander de repasser par le formulaire |
| « impossible de lire votre équipe » | demande écrite à la main, sans liste déroulante | idem |
| Le commentaire arrive mais pas l'invitation | jeton expiré, ou permission *Administration* absente | refaire le jeton, §3.1 |
| L'étape « Inscrire dans groupes.json » échoue au push | « Do not allow bypassing » a été coché | le décocher, §3.3 |
| Une PR est refusée alors que l'étudiant·e est bien inscrit·e | la PR contient un commit qui touche un autre dossier | lire la liste `❌ INTERDIT` dans le journal |

Commandes utiles :

```bash
# Les dernières exécutions du robot d'inscription
gh run list --repo bdarties/arcade --workflow inscription.yml --limit 10

# Le détail d'une exécution qui a échoué
gh run view <id> --repo bdarties/arcade --log-failed

# Qui a accès au dépôt, et avec quel droit
gh api repos/bdarties/arcade/collaborators --jq '.[] | "\(.login)\t\(.role_name)"'

# Les invitations encore en attente d'acceptation
gh api repos/bdarties/arcade/invitations --jq '.[] | .invitee.login'
```

---

## 6. Limites connues

Le dispositif vérifie que le compte GitHub est bien celui de la personne
connectée, **mais pas que cette personne est l'étudiant·e qu'elle prétend
être**. N'importe quel compte GitHub peut ouvrir une demande sur ce dépôt
public et obtenir l'accès en écriture à un dossier de jeu.

C'est un compromis assumé : la vérification d'identité coûterait plus cher que
le risque, pour un dépôt de travaux pratiques dont l'historique est
entièrement réversible. Si le besoin se présentait, la parade la plus simple
serait d'ajouter au robot une liste blanche de pseudos, remplie en début de
semestre.
