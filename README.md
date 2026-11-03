# Site Majordo

Site vitrine 100 % statique : aucun outil à installer, aucune étape de build.

```
index.html               page d'accueil
mentions-legales.html    mentions légales et confidentialité
styles.css               design (couleurs en haut du fichier)
script.js                interactions + réglages à modifier
assets/                  favicon, icône iPhone, image de partage
```

## 1. Les 2 réglages à faire (en haut de `script.js`)

```js
const WEBHOOK_URL = "WEBHOOK_URL";        // → l'URL de votre webhook n8n
const CONTACT = {
  email: "andrea.co.08ecg@gmail.com",     // → contact@majordo.fr plus tard
  telephone: "",                          // facultatif
};
```

L'email s'affiche automatiquement partout (accueil, pied de page, mentions légales).
Tant que `WEBHOOK_URL` n'est pas remplacé, le formulaire affiche un message clair qui invite à écrire par email.

**Côté n8n** : créez un nœud *Webhook* avec la méthode `POST` et ouvrez *Options → Allowed Origins (CORS)* : mettez `*` ou `https://majordo.fr`. Activez le workflow, puis copiez l'URL de **production** (pas celle de test). Le formulaire envoie ce JSON :

```json
{ "nom": "…", "etablissement": "…", "logements": 7, "contact": "…",
  "contact_type": "email | telephone", "message": "…",
  "page": "…", "envoye_le": "2026-11-03T10:00:00Z", "source": "site-majordo" }
```

## 2. Modifier un fichier depuis l'iPad

Le plus simple : passez par GitHub dans Safari. Ouvrez le fichier dans le dépôt, touchez l'icône crayon, modifiez, puis touchez **Commit changes**.
Si le site est relié à Netlify (étape 3, option B), il se met à jour tout seul en une minute.

## 3. Mettre le site en ligne sur Netlify

**Option A : glisser le dossier (sans GitHub)**
1. Récupérez le dossier du site dans l'app **Fichiers** (sur GitHub : bouton vert *Code* → *Download ZIP*, puis touchez le ZIP dans Fichiers pour le décompresser).
2. Dans Safari, allez sur **app.netlify.com/drop** et créez un compte gratuit.
3. Touchez la zone de dépôt et choisissez le **dossier** qui contient `index.html` (pas un dossier au-dessus).
4. Netlify affiche une adresse du type `https://nom-au-hasard.netlify.app`. Le site est en ligne.
5. Pour une mise à jour : *Deploys* → glissez de nouveau le dossier.

**Option B (recommandée) : relier GitHub, mises à jour automatiques**
1. Sur app.netlify.com : **Add new project → Import an existing project → GitHub**.
2. Choisissez le dépôt `majordo-site`.
3. Laissez *Build command* **vide** et mettez `.` dans *Publish directory*. Puis **Deploy**.
4. Chaque modification enregistrée sur la branche `main` met le site à jour.

Pour Cloudflare Pages, c'est le même principe : *Workers & Pages → Create → Pages*, puis *Upload assets* (glisser le dossier) ou *Connect to Git*, sans commande de build.

## 4. Brancher le nom de domaine (ex. majordo.fr)

1. Achetez le domaine (OVH, Gandi, ou directement dans Netlify : *Domains → Add a domain → Buy*).
   Si vous l'achetez dans Netlify, tout est automatique : passez directement à l'étape 4.
2. Dans Netlify : *Domain management → Add a domain* → tapez `majordo.fr` → *Verify*.
3. Netlify vous indique quoi faire chez votre registraire. Le plus simple est de **remplacer les serveurs DNS** (« nameservers ») par les 4 adresses `dnsX.p0X.nsone.net` qu'il vous donne. Chez OVH, c'est dans *Domaines → majordo.fr → Serveurs DNS → Modifier*.
4. Attendez quelques heures (jusqu'à 24 h). Le **HTTPS** (cadenas) s'active tout seul.
5. Mettez `majordo.fr` comme domaine principal, puis remplacez `https://majordo.fr/` dans les balises `og:url` et `canonical` des deux pages HTML si l'adresse finale est différente.

> Attention : si vos emails passent par ce domaine (contact@majordo.fr), recréez les enregistrements **MX** dans le DNS Netlify avant de changer les serveurs DNS, sinon les emails ne seront plus reçus.

## 5. Avant la mise en ligne définitive

- [ ] Faire **relire `mentions-legales.html`** et compléter les éléments surlignés : adresse, hébergeur, outil de stockage des demandes, date. Retirer ensuite l'encadré « Brouillon ».
- [ ] Remplacer `WEBHOOK_URL` et tester le formulaire.
- [ ] Remplacer l'email par contact@majordo.fr quand il sera créé.
- [ ] Ajouter le témoignage et les résultats dans la section « Références » quand ils existeront (emplacements marqués « À venir » dans `index.html`).
- [ ] (Facultatif) Héberger les polices soi-même au lieu de Google Fonts, pour ne plus transmettre l'adresse IP des visiteurs à Google.
