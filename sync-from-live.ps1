# Reverse Sync Script: Live Website → Test Website
# This script copies files from LIVE website to TEST website (preserving test environment config)

$liveDir = "c:\Users\colbi\OneDrive\Desktop\ResourceTracker-main"
$testDir = "c:\Users\colbi\OneDrive\Desktop\Guildgamesh Resource Tracker Web - OV"

# Files to PRESERVE from test environment (don't overwrite)
$preservePatterns = @(
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
    "sync-from-live.ps1",
    "sync-to-live.ps1",
    "DEPLOYMENT_CHECKLIST.md",
    ".syncignore",
    "*.log",
    "full-test.js",
    "setup-local-db.js",
    "test-db.js"
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "REVERSE SYNC: Live Website → Test Website" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  WARNING: This will OVERWRITE test website code with live website code!" -ForegroundColor Yellow
Write-Host ""

# Show what will be preserved
Write-Host "Files that will be PRESERVED in test website:" -ForegroundColor Green
$preservePatterns | ForEach-Object { Write-Host "  - $_" -ForegroundColor Green }
Write-Host ""

# Confirm before proceeding
Write-Host "Source (Live): $liveDir" -ForegroundColor Yellow
Write-Host "Target (Test): $testDir" -ForegroundColor Yellow
Write-Host ""
$confirmation = Read-Host "Continue with reverse sync? Type 'yes' to proceed"

if ($confirmation -ne "yes") {
    Write-Host "Sync cancelled." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Starting reverse sync..." -ForegroundColor Green
Write-Host ""

# Create backup of test website BEFORE overwriting
$backupDir = "$testDir-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Host "Creating backup: $backupDir" -ForegroundColor Magenta
Copy-Item -Path $testDir -Destination $backupDir -Recurse -Force
Write-Host "✓ Backup created" -ForegroundColor Green
Write-Host ""

# Get all files from LIVE directory
$liveFiles = Get-ChildItem -Path $liveDir -Recurse -File

$syncedCount = 0
$skippedCount = 0
$preservedCount = 0

foreach ($file in $liveFiles) {
    $relativePath = $file.FullName.Substring($liveDir.Length + 1)
    
    # Check if file should be preserved (exists in test and matches preserve pattern)
    $shouldPreserve = $false
    foreach ($pattern in $preservePatterns) {
        if ($relativePath -like "*$pattern*") {
            $targetPath = Join-Path -Path $testDir -ChildPath $relativePath
            if (Test-Path $targetPath) {
                $shouldPreserve = $true
                Write-Host "PRESERVE: $relativePath" -ForegroundColor Cyan
                $preservedCount++
                break
            }
        }
    }
    
    if ($shouldPreserve) {
        continue
    }
    
    # Copy file to test directory (overwriting)
    $targetPath = Join-Path -Path $testDir -ChildPath $relativePath
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
Write-Host "Reverse Sync Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Files synced from live: $syncedCount" -ForegroundColor Green
Write-Host "Test files preserved: $preservedCount" -ForegroundColor Cyan
Write-Host "Backup created: $backupDir" -ForegroundColor Magenta
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Verify test website still has correct .env.local file" -ForegroundColor White
Write-Host "2. Install dependencies if needed: npm install" -ForegroundColor White
Write-Host "3. Test the website: npm run dev" -ForegroundColor White
Write-Host "4. If issues occur, restore from: $backupDir" -ForegroundColor White
Write-Host ""
Write-Host "✓ Test website now has all code fixes from live website!" -ForegroundColor Green
Write-Host ""
