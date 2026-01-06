# Sync Script: Test Web App → Live Web App
# This script copies tested files from the test environment to production

$testDir = "c:\Users\colbi\OneDrive\Desktop\Guildgamesh Resource Tracker Web - OV"
$liveDir = "c:\Users\colbi\OneDrive\Desktop\ResourceTracker-main"

# Files and folders to EXCLUDE from sync (environment-specific)
$excludePatterns = @(
    ".env",
    ".env.local",
    ".env.production",
    "local.db",
    "local.db-shm",
    "local.db-wal",
    "node_modules",
    ".next",
    ".git",
    ".vercel",
    "sync-to-live.ps1",
    "DEPLOYMENT_CHECKLIST.md",
    "*.log",
    "full-test.js",
    "setup-local-db.js",
    "test-db.js"
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Web App Sync: Test → Live" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Confirm before proceeding
Write-Host "Source (Test): $testDir" -ForegroundColor Yellow
Write-Host "Target (Live): $liveDir" -ForegroundColor Yellow
Write-Host ""
$confirmation = Read-Host "This will overwrite files in LIVE. Continue? (yes/no)"

if ($confirmation -ne "yes") {
    Write-Host "Sync cancelled." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Starting sync..." -ForegroundColor Green
Write-Host ""

# Create backup of live version
$backupDir = "$liveDir-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Host "Creating backup: $backupDir" -ForegroundColor Magenta
Copy-Item -Path $liveDir -Destination $backupDir -Recurse -Force

# Get all files from test directory
$testFiles = Get-ChildItem -Path $testDir -Recurse -File

$syncedCount = 0
$skippedCount = 0

foreach ($file in $testFiles) {
    $relativePath = $file.FullName.Substring($testDir.Length + 1)
    
    # Check if file should be excluded
    $shouldExclude = $false
    foreach ($pattern in $excludePatterns) {
        if ($relativePath -like "*$pattern*") {
            $shouldExclude = $true
            break
        }
    }
    
    if ($shouldExclude) {
        Write-Host "SKIP: $relativePath" -ForegroundColor DarkGray
        $skippedCount++
        continue
    }
    
    # Copy file to live directory
    $targetPath = Join-Path -Path $liveDir -ChildPath $relativePath
    $targetDir = Split-Path -Path $targetPath -Parent
    
    # Ensure target directory exists
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
    
    Copy-Item -Path $file.FullName -Destination $targetPath -Force
    Write-Host "SYNC: $relativePath" -ForegroundColor Green
    $syncedCount++
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Sync Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Files synced: $syncedCount" -ForegroundColor Green
Write-Host "Files skipped: $skippedCount" -ForegroundColor Yellow
Write-Host "Backup created: $backupDir" -ForegroundColor Magenta
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Review changes in: $liveDir" -ForegroundColor White
Write-Host "2. Test the live application locally" -ForegroundColor White
Write-Host "3. Deploy to Vercel if everything works" -ForegroundColor White
Write-Host "4. If issues occur, restore from: $backupDir" -ForegroundColor White
Write-Host ""
