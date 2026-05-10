#!/usr/bin/env bash
# Script de récupération du code source depuis Vercel
# Usage: bash recover_from_vercel.sh
# Prérequis: curl, git, gh (GitHub CLI) ou accès manuel

set -e

# ─── CONFIGURATION ────────────────────────────────────────────────────────────
VERCEL_TOKEN="vca_BQuu9ChDu3n6Pfh6YQnCshpoYkWDSFKogLqmBtQ0tC8NAA5rXt340sjz"
PROJECT_NAME="oscarappmvp"
GITHUB_REPO="OscarIA-Admin/Oscar-app"   # Nouveau repo cible
OUTPUT_DIR="./oscar-app-recovered"
# ──────────────────────────────────────────────────────────────────────────────

API="https://api.vercel.com"
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

echo "══════════════════════════════════════════"
echo "  Récupération Vercel → GitHub"
echo "  Projet : $PROJECT_NAME"
echo "══════════════════════════════════════════"
echo

# ─── ÉTAPE 1 : Vérifier le token ──────────────────────────────────────────────
log "Vérification du token Vercel..."
USER_INFO=$(curl -sf -H "Authorization: Bearer $VERCEL_TOKEN" "$API/v2/user") \
  || err "Token invalide ou API inaccessible. Vérifiez votre token sur vercel.com/account/tokens"

USERNAME=$(echo "$USER_INFO" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('user',{}).get('username','?'))" 2>/dev/null || echo "?")
log "Connecté en tant que : $USERNAME"

# ─── ÉTAPE 2 : Trouver l'ID du projet ─────────────────────────────────────────
log "Recherche du projet '$PROJECT_NAME'..."
PROJECT=$(curl -sf -H "Authorization: Bearer $VERCEL_TOKEN" \
  "$API/v9/projects/$PROJECT_NAME") \
  || err "Projet '$PROJECT_NAME' introuvable."

PROJECT_ID=$(echo "$PROJECT" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
log "Projet trouvé : ID=$PROJECT_ID"

# ─── ÉTAPE 3 : Récupérer le dernier déploiement ───────────────────────────────
log "Récupération du dernier déploiement..."
DEPLOYMENTS=$(curl -sf -H "Authorization: Bearer $VERCEL_TOKEN" \
  "$API/v6/deployments?projectId=$PROJECT_ID&limit=5&state=READY") \
  || err "Impossible de lister les déploiements."

DEPLOYMENT_ID=$(echo "$DEPLOYMENTS" | python3 -c "
import sys, json
deps = json.load(sys.stdin).get('deployments', [])
if not deps:
    print('NONE')
else:
    print(deps[0]['uid'])
" 2>/dev/null)

if [ "$DEPLOYMENT_ID" = "NONE" ] || [ -z "$DEPLOYMENT_ID" ]; then
  err "Aucun déploiement READY trouvé pour ce projet."
fi
log "Déploiement : $DEPLOYMENT_ID"

# ─── ÉTAPE 4 : Lister les fichiers du déploiement ─────────────────────────────
log "Listage des fichiers source..."
FILES=$(curl -sf -H "Authorization: Bearer $VERCEL_TOKEN" \
  "$API/v6/deployments/$DEPLOYMENT_ID/files") \
  || err "Impossible de lister les fichiers."

# ─── ÉTAPE 5 : Télécharger tous les fichiers source ───────────────────────────
mkdir -p "$OUTPUT_DIR"
log "Téléchargement des fichiers vers '$OUTPUT_DIR'..."

download_files() {
  local json="$1"
  local prefix="$2"

  echo "$json" | python3 - "$prefix" "$DEPLOYMENT_ID" "$VERCEL_TOKEN" "$OUTPUT_DIR" "$API" << 'PYEOF'
import sys, json, os, urllib.request

data = json.loads(sys.stdin.read())
prefix   = sys.argv[1]
dep_id   = sys.argv[2]
token    = sys.argv[3]
out_dir  = sys.argv[4]
api_base = sys.argv[5]

def fetch_tree(nodes, path_prefix):
    for node in nodes:
        name = node.get("name", "")
        ntype = node.get("type", "")
        full_path = os.path.join(path_prefix, name) if path_prefix else name

        if ntype == "directory":
            # Fetch children
            uid = node.get("uid", "")
            if uid:
                url = f"{api_base}/v6/deployments/{dep_id}/files/{uid}"
                req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
                try:
                    with urllib.request.urlopen(req) as r:
                        children = json.loads(r.read())
                    fetch_tree(children, full_path)
                except Exception as e:
                    print(f"  [!] Erreur dossier {full_path}: {e}", file=sys.stderr)
        elif ntype == "file":
            uid = node.get("uid", "")
            if uid:
                dest = os.path.join(out_dir, full_path)
                os.makedirs(os.path.dirname(dest), exist_ok=True)
                url = f"{api_base}/v7/deployments/{dep_id}/files/{uid}"
                req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
                try:
                    with urllib.request.urlopen(req) as r:
                        content = r.read()
                    with open(dest, "wb") as f:
                        f.write(content)
                    print(f"  → {full_path}")
                except Exception as e:
                    print(f"  [!] Erreur fichier {full_path}: {e}", file=sys.stderr)

fetch_tree(data if isinstance(data, list) else data.get("files", [data]), prefix)
PYEOF
}

download_files "$FILES" ""
log "Fichiers téléchargés dans '$OUTPUT_DIR'"

# ─── ÉTAPE 6 : Compter les fichiers récupérés ────────────────────────────────
FILE_COUNT=$(find "$OUTPUT_DIR" -type f | wc -l)
log "Total : $FILE_COUNT fichier(s) récupéré(s)"
echo
find "$OUTPUT_DIR" -type f | head -30 | sed 's|^|    |'
[ "$FILE_COUNT" -gt 30 ] && echo "    ... (et $((FILE_COUNT - 30)) autres)"
echo

# ─── ÉTAPE 7 : Initialiser git et pousser vers GitHub ────────────────────────
echo "══════════════════════════════════════════"
echo "  Initialisation du repo Git"
echo "══════════════════════════════════════════"

cd "$OUTPUT_DIR"

git init
git add -A
git commit -m "chore: récupération du code source depuis Vercel (déploiement $DEPLOYMENT_ID)"

warn "Création du repo GitHub '$GITHUB_REPO'..."
warn "Assure-toi d'être connecté avec : gh auth login"
echo

# Créer le repo GitHub (nécessite gh CLI)
if command -v gh &>/dev/null; then
  REPO_OWNER=$(echo "$GITHUB_REPO" | cut -d'/' -f1)
  REPO_NAME=$(echo "$GITHUB_REPO" | cut -d'/' -f2)
  gh repo create "$GITHUB_REPO" --public --description "Oscar App MVP - Récupéré depuis Vercel" 2>/dev/null \
    && log "Repo GitHub créé : https://github.com/$GITHUB_REPO" \
    || warn "Le repo existe peut-être déjà, tentative de push..."

  git remote add origin "https://github.com/$GITHUB_REPO.git"
  git push -u origin main \
    && log "Code poussé sur https://github.com/$GITHUB_REPO" \
    || err "Push échoué. Vérifiez vos permissions GitHub."
else
  warn "GitHub CLI (gh) non installé. Steps manuels :"
  echo "  1. Créer le repo : https://github.com/new"
  echo "     Nom : Oscar-app | Organisation : OscarIA-Admin"
  echo "  2. Puis exécuter :"
  echo "     git remote add origin https://github.com/$GITHUB_REPO.git"
  echo "     git push -u origin main"
fi

# ─── ÉTAPE 8 : Reconfigurer Vercel → nouveau repo ───────────────────────────
echo
echo "══════════════════════════════════════════"
echo "  Reconnexion Vercel → GitHub"
echo "══════════════════════════════════════════"
echo
echo "  Pour lier le projet Vercel au nouveau repo :"
echo "  → vercel link --project $PROJECT_NAME"
echo "  → Dans le dashboard Vercel : Settings → Git → Disconnect → Reconnecter à OscarIA-Admin/Oscar-app"
echo
log "Récupération terminée !"
