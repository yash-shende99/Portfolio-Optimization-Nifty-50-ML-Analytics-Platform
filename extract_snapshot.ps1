# ==============================================================================
# Portfolio-ML Complete Codebase Snapshot Extractor
# ==============================================================================
# Usage:
#   .\extract_snapshot.ps1              # Extracts Python ML & Backend Code + Configs
#   .\extract_snapshot.ps1 -FullStack   # Includes Next.js Frontend Code (TSX/TS/CSS)
# ==============================================================================

param(
    [switch]$FullStack
)

$exclude = 'venv|node_modules|__pycache__|\.pyc$|\.pytest_cache|\.git|\.next'
$output = New-Object System.Collections.Generic.List[string]

$output.Add("==============================================================================")
$output.Add("           PORTFOLIO-ML QUANT & AI WEALTH PLATFORM SNAPSHOT                   ")
$output.Add("==============================================================================")
$output.Add("Generated : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
$output.Add("FullStack : $(if ($FullStack) { 'YES (Includes Next.js)' } else { 'NO (Backend & ML only)' })")
$output.Add("==============================================================================")

# 1. Config & Project Specs
Write-Host "Extracting configuration and specs..." -ForegroundColor Cyan
foreach ($f in @("config\config.yaml", "requirements.txt", "start_all.bat", "run_full_pipeline.bat")) {
    if (Test-Path $f) {
        $output.Add("")
        $output.Add("==============================================================================")
        $output.Add("FILE: $f")
        $output.Add("==============================================================================")
        Get-Content $f | ForEach-Object { $output.Add($_) }
    }
}

# 2. Root Python Scripts
Write-Host "Extracting root scripts..." -ForegroundColor Cyan
Get-ChildItem -Path . -Filter *.py -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch $exclude } |
    Sort-Object Name |
    ForEach-Object {
        $output.Add("")
        $output.Add("==============================================================================")
        $output.Add("FILE: $($_.Name)")
        $output.Add("==============================================================================")
        Get-Content $_.FullName | ForEach-Object { $output.Add($_) }
    }

# 3. Core Python Pipelines (ML, Quant, API, DAGs, Tests)
Write-Host "Extracting Python pipelines (src, dags, tests)..." -ForegroundColor Cyan
foreach ($folder in @("src", "dags", "tests")) {
    if (Test-Path $folder) {
        Get-ChildItem -Path $folder -Recurse -Filter *.py -ErrorAction SilentlyContinue |
            Where-Object { $_.FullName -notmatch $exclude } |
            Sort-Object FullName |
            ForEach-Object {
                $relPath = Resolve-Path -Relative $_.FullName
                $output.Add("")
                $output.Add("==============================================================================")
                $output.Add("FILE: $relPath")
                $output.Add("==============================================================================")
                Get-Content $_.FullName | ForEach-Object { $output.Add($_) }
            }
    }
}

# 4. Optional: Frontend Next.js / TypeScript App
if ($FullStack) {
    Write-Host "Extracting Next.js frontend code..." -ForegroundColor Cyan
    $frontendFiles = @("frontend\package.json", "frontend\tsconfig.json", "frontend\postcss.config.js")
    foreach ($f in $frontendFiles) {
        if (Test-Path $f) {
            $output.Add("")
            $output.Add("==============================================================================")
            $output.Add("FILE: $f")
            $output.Add("==============================================================================")
            Get-Content $f | ForEach-Object { $output.Add($_) }
        }
    }
    
    Get-ChildItem -Path "frontend\src" -Recurse -Include *.ts, *.tsx, *.css -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -notmatch $exclude } |
        Sort-Object FullName |
        ForEach-Object {
            $relPath = Resolve-Path -Relative $_.FullName
            $output.Add("")
            $output.Add("==============================================================================")
            $output.Add("FILE: $relPath")
            $output.Add("==============================================================================")
            Get-Content $_.FullName | ForEach-Object { $output.Add($_) }
        }
}

$outputFile = "review_snapshot.txt"
$output | Out-File $outputFile -Encoding utf8
$file = Get-Item $outputFile

Write-Host "`nSnapshot successfully created!" -ForegroundColor Green
Write-Host "File : $($file.FullName)" -ForegroundColor White
Write-Host "Size : $([math]::Round($file.Length / 1KB, 2)) KB" -ForegroundColor Yellow
Write-Host "Lines: $((Get-Content $file.FullName).Count)`n" -ForegroundColor Yellow

# Try opening in VS Code if installed
if (Get-Command code -ErrorAction SilentlyContinue) {
    code $outputFile
}
