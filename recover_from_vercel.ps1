# Script de récupération Vercel → GitHub (Windows PowerShell)
# Exécuter dans PowerShell : .\recover_from_vercel.ps1

$ErrorActionPreference = "Stop"

# ─── CONFIGURATION ────────────────────────────────────────────────────────────
$VERCEL_TOKEN  = "vca_BQuu9ChDu3n6Pfh6YQnCshpoYkWDSFKogLqmBtQ0tC8NAA5rXt340sjz"
$PROJECT_NAME  = "oscarappmvp"
$GITHUB_REPO   = "OscarIA-Admin/Oscar-app"
$OUTPUT_DIR    = ".\oscar-app-recovered"
$API           = "https://api.vercel.com"
# ──────────────────────────────────────────────────────────────────────────────

$headers = @{ "Authorization" = "Bearer $VERCEL_TOKEN" }

function Log  { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Warn { param($msg) Write-Host "[!]  $msg" -ForegroundColor Yellow }
function Err  { param($msg) Write-Host "[X]  $msg" -ForegroundColor Red; exit 1 }

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  Recuperation Vercel → GitHub" -ForegroundColor Cyan
Write-Host "  Projet : $PROJECT_NAME" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# ─── Étape 1 : Vérifier le token ─────────────────────────────────────────────
Log "Verification du token Vercel..."
try {
    $user = Invoke-RestMethod -Uri "$API/v2/user" -Headers $headers
    Log "Connecte en tant que : $($user.user.username)"
} catch {
    Err "Token invalide ou API inaccessible : $_"
}

# ─── Étape 2 : Trouver le projet ─────────────────────────────────────────────
Log "Recherche du projet '$PROJECT_NAME'..."
try {
    $project = Invoke-RestMethod -Uri "$API/v9/projects/$PROJECT_NAME" -Headers $headers
    $projectId = $project.id
    Log "Projet trouve : ID=$projectId"
} catch {
    Err "Projet '$PROJECT_NAME' introuvable : $_"
}

# ─── Étape 3 : Dernier déploiement READY ─────────────────────────────────────
Log "Recuperation du dernier deploiement..."
$deps = Invoke-RestMethod -Uri "$API/v6/deployments?projectId=$projectId&limit=5&state=READY" -Headers $headers
if ($deps.deployments.Count -eq 0) {
    Err "Aucun deploiement READY trouve."
}
$deploymentId = $deps.deployments[0].uid
Log "Deploiement : $deploymentId"

# ─── Étape 4 : Télécharger les fichiers récursivement ────────────────────────
Log "Telechargement des fichiers source..."
New-Item -ItemType Directory -Path $OUTPUT_DIR -Force | Out-Null

function Download-Files {
    param($nodes, $prefix)
    foreach ($node in $nodes) {
        $name = $node.name
        $type = $node.type
        $uid  = $node.uid
        $path = if ($prefix) { "$prefix/$name" } else { $name }

        if ($type -eq "directory") {
            $children = Invoke-RestMethod -Uri "$API/v6/deployments/$deploymentId/files/$uid" -Headers $headers
            Download-Files -nodes $children -prefix $path
        } elseif ($type -eq "file") {
            $dest = Join-Path $OUTPUT_DIR ($path -replace "/", "\")
            $destDir = Split-Path $dest -Parent
            if (-not (Test-Path $destDir)) {
                New-Item -ItemType Directory -Path $destDir -Force | Out-Null
            }
            try {
                Invoke-WebRequest -Uri "$API/v7/deployments/$deploymentId/files/$uid" `
                    -Headers $headers -OutFile $dest
                Write-Host "  → $path" -ForegroundColor Gray
            } catch {
                Warn "Erreur sur $path : $_"
            }
        }
    }
}

$rootFiles = Invoke-RestMethod -Uri "$API/v6/deployments/$deploymentId/files" -Headers $headers
Download-Files -nodes $rootFiles -prefix ""

$count = (Get-ChildItem $OUTPUT_DIR -Recurse -File).Count
Log "Total : $count fichier(s) recupere(s)"
Write-Host ""

# ─── Étape 5 : Git init + commit ─────────────────────────────────────────────
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  Initialisation Git" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

Push-Location $OUTPUT_DIR
git init
git add -A
git commit -m "chore: recuperation code source depuis Vercel (deploiement $deploymentId)"
Pop-Location

# ─── Étape 6 : Créer repo GitHub et push ─────────────────────────────────────
Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  Push vers GitHub" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

$ghAvailable = Get-Command gh -ErrorAction SilentlyContinue
if ($ghAvailable) {
    Log "Creation du repo GitHub '$GITHUB_REPO'..."
    gh repo create $GITHUB_REPO --public --description "Oscar App MVP - Recupere depuis Vercel" 2>$null
    Push-Location $OUTPUT_DIR
    git remote add origin "https://github.com/$GITHUB_REPO.git"
    git push -u origin main
    Pop-Location
    Log "Code pousse sur https://github.com/$GITHUB_REPO"
} else {
    Warn "GitHub CLI (gh) non installe."
    Warn "Installe-le : winget install --id GitHub.cli"
    Write-Host ""
    Write-Host "  Puis execute dans '$OUTPUT_DIR' :" -ForegroundColor Yellow
    Write-Host "    gh auth login" -ForegroundColor White
    Write-Host "    gh repo create $GITHUB_REPO --public" -ForegroundColor White
    Write-Host "    git remote add origin https://github.com/$GITHUB_REPO.git" -ForegroundColor White
    Write-Host "    git push -u origin main" -ForegroundColor White
}

Write-Host ""
Log "Recuperation terminee !"
