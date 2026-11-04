# ==============================================================================
# Script: push-to-github.ps1
# Tự động đóng gói và đẩy toàn bộ mã nguồn dự án lên GitHub qua GitHub REST API
# Không yêu cầu cài đặt git.exe hay node.js
# ==============================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$GitHubToken,

    [Parameter(Mandatory=$false)]
    [string]$RepoName = "QuanGiaHuongNoi-bot-discord",

    [Parameter(Mandatory=$false)]
    [string]$CommitMessage = "feat: complete Discord bot v14 with web controller and real moderation",

    [switch]$Private
)

$ErrorActionPreference = "Stop"

# Nếu chưa truyền Token qua tham số, yêu cầu nhập
if ([string]::IsNullOrWhiteSpace($GitHubToken)) {
    Write-Host ""
    Write-Host "==============================================================" -ForegroundColor Cyan
    Write-Host " 🚀 ĐẨY TOÀN BỘ PROJECT LÊN GITHUB (KHÔNG CẦN CÀI GIT)" -ForegroundColor Cyan
    Write-Host "==============================================================" -ForegroundColor Cyan
    Write-Host "Bạn cần có 1 Personal Access Token (PAT) từ GitHub." -ForegroundColor Yellow
    Write-Host "Nếu chưa có, hãy tạo tại: https://github.com/settings/tokens" -ForegroundColor Yellow
    Write-Host "(Chọn Token Classic -> Tích chọn quyền: 'repo')" -ForegroundColor Yellow
    Write-Host ""
    $GitHubToken = Read-Host "Nhập GitHub Token của bạn (ghp_...)"
}

if ([string]::IsNullOrWhiteSpace($GitHubToken)) {
    Write-Error "GitHub Token không được để trống!"
    exit 1
}

$GitHubToken = $GitHubToken.Trim()

$headers = @{
    "Authorization" = "Bearer $GitHubToken"
    "Accept"        = "application/vnd.github.v3+json"
    "User-Agent"    = "Antigravity-GitHub-Uploader"
}

Write-Host "`n[1/6] 🔍 Đang xác thực tài khoản GitHub..." -ForegroundColor Cyan
try {
    $userRes = Invoke-RestMethod -Uri "https://api.github.com/user" -Method Get -Headers $headers
    $username = $userRes.login
    Write-Host "  -> Đăng nhập thành công với tài khoản: $username" -ForegroundColor Green
} catch {
    Write-Error "GitHub Token không hợp lệ hoặc đã hết hạn! Vui lòng kiểm tra lại."
    exit 1
}

# Kiểm tra xem repository đã tồn tại chưa
Write-Host "`n[2/6] 📁 Đang kiểm tra repository '$username/$RepoName'..." -ForegroundColor Cyan
$repoExists = $false
$defaultBranch = "main"

try {
    $repoRes = Invoke-RestMethod -Uri "https://api.github.com/repos/$username/$RepoName" -Method Get -Headers $headers
    $repoExists = $true
    if ($repoRes.default_branch) {
        $defaultBranch = $repoRes.default_branch
    }
    Write-Host "  -> Tìm thấy repository '$username/$RepoName' (branch mặc định: $defaultBranch)" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-Host "  -> Repository chưa tồn tại. Đang tạo mới trên GitHub..." -ForegroundColor Yellow
        $createBody = @{
            name        = $RepoName
            description = "Discord Bot QuanGiaHuongNoi - Full-Stack Discord.js v14 Bot + Web Controller"
            private     = [bool]$Private
            auto_init   = $true
        } | ConvertTo-Json

        $newRepo = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method Post -Headers $headers -Body $createBody -ContentType "application/json"
        $defaultBranch = if ($newRepo.default_branch) { $newRepo.default_branch } else { "main" }
        Write-Host "  -> Tạo thành công repository '$username/$RepoName'!" -ForegroundColor Green
        Start-Sleep -Seconds 2
    } else {
        Write-Error "Lỗi khi kiểm tra repository: $_"
        exit 1
    }
}

# Lấy SHA commit gần nhất
Write-Host "`n[3/6] 🔗 Lấy tham chiếu branch '$defaultBranch'..." -ForegroundColor Cyan
$latestCommitSha = $null
try {
    $refRes = Invoke-RestMethod -Uri "https://api.github.com/repos/$username/$RepoName/git/ref/heads/$defaultBranch" -Method Get -Headers $headers
    $latestCommitSha = $refRes.object.sha
    Write-Host "  -> SHA commit gần nhất: $latestCommitSha" -ForegroundColor Green
} catch {
    Write-Host "  -> Branch chưa có commit nào, sẽ tạo commit khởi đầu." -ForegroundColor Yellow
}

# Thu thập toàn bộ tệp dự án (bỏ qua node_modules, .env, .git...)
Write-Host "`n[4/6] 📦 Đang thu thập và chuẩn bị các tệp dự án..." -ForegroundColor Cyan
$scriptDir = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($scriptDir)) {
    $scriptDir = Get-Location
}

$ignoredFolders = @('node_modules', 'dist', 'dev-dist', 'build', 'coverage', '.git', '.aistudio', '.playwright', '.gemini')
$ignoredFiles = @('.env', '.env.local', '.env.production', '.DS_Store', 'bun.lock')

$allFiles = Get-ChildItem -Path $scriptDir -Recurse -File | Where-Object {
    $rel = $_.FullName.Substring($scriptDir.Length).TrimStart('\', '/')
    $parts = $rel.Split([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar)
    
    # Check folder ignore
    $skip = $false
    foreach ($p in $parts[0..($parts.Length - 2)]) {
        if ($ignoredFolders -contains $p) {
            $skip = $true
            break
        }
    }
    if ($skip) { return $false }

    # Check file ignore
    $fileName = $_.Name
    if ($ignoredFiles -contains $fileName) { return $false }
    if ($fileName.StartsWith('.env') -and $fileName -ne '.env.example') { return $false }
    if ($fileName.EndsWith('.log')) { return $false }

    return $true
}

Write-Host "  -> Tổng số tệp cần tải lên: $($allFiles.Count) tệp" -ForegroundColor Green

# Tạo Git Blobs cho từng tệp
Write-Host "`n[5/6] ☁️ Đang tải các tệp lên GitHub..." -ForegroundColor Cyan
$treeItems = @()
$counter = 0

foreach ($file in $allFiles) {
    $counter++
    $relPath = $file.FullName.Substring($scriptDir.Length).TrimStart('\', '/').Replace('\', '/')
    Write-Progress -Activity "Đang đẩy tệp lên GitHub" -Status "[$counter/$($allFiles.Count)] $relPath" -PercentComplete (($counter / $allFiles.Count) * 100)

    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $b64 = [System.Convert]::ToBase64String($bytes)

    $blobBody = @{
        content  = $b64
        encoding = "base64"
    } | ConvertTo-Json

    try {
        $blobRes = Invoke-RestMethod -Uri "https://api.github.com/repos/$username/$RepoName/git/blobs" -Method Post -Headers $headers -Body $blobBody -ContentType "application/json"
        $treeItems += @{
            path = $relPath
            mode = "100644"
            type = "blob"
            sha  = $blobRes.sha
        }
    } catch {
        Write-Warning "Không thể tải lên tệp: $relPath. Bỏ qua."
    }
}

Write-Progress -Activity "Đang đẩy tệp lên GitHub" -Completed

# Tạo Git Tree
Write-Host "`n[6/6] 🌳 Đang tạo Git Tree và Commit..." -ForegroundColor Cyan
$treeBody = @{
    tree = $treeItems
}
if ($latestCommitSha) {
    $treeBody["base_tree"] = $latestCommitSha
}
$treeBodyJson = $treeBody | ConvertTo-Json -Depth 5

$treeRes = Invoke-RestMethod -Uri "https://api.github.com/repos/$username/$RepoName/git/trees" -Method Post -Headers $headers -Body $treeBodyJson -ContentType "application/json"
$newTreeSha = $treeRes.sha

# Tạo Commit
$commitBody = @{
    message = $CommitMessage
    tree    = $newTreeSha
    parents = if ($latestCommitSha) { @($latestCommitSha) } else { @() }
} | ConvertTo-Json -Depth 3

$commitRes = Invoke-RestMethod -Uri "https://api.github.com/repos/$username/$RepoName/git/commits" -Method Post -Headers $headers -Body $commitBody -ContentType "application/json"
$newCommitSha = $commitRes.sha

# Cập nhật Branch ref
$refPatchBody = @{
    sha   = $newCommitSha
    force = $true
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "https://api.github.com/repos/$username/$RepoName/git/refs/heads/$defaultBranch" -Method Patch -Headers $headers -Body $refPatchBody -ContentType "application/json" | Out-Null
} catch {
    # Nếu ref chưa có, tạo ref mới
    $refCreateBody = @{
        ref = "refs/heads/$defaultBranch"
        sha = $newCommitSha
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "https://api.github.com/repos/$username/$RepoName/git/refs" -Method Post -Headers $headers -Body $refCreateBody -ContentType "application/json" | Out-Null
}

$repoUrl = "https://github.com/$username/$RepoName"
Write-Host ""
Write-Host "==============================================================" -ForegroundColor Green
Write-Host " 🎉 ĐÃ ĐẨY THÀNH CÔNG TOÀN BỘ PROJECT LÊN GITHUB!" -ForegroundColor Green
Write-Host " 🌐 Link Repository: $repoUrl" -ForegroundColor Cyan
Write-Host " 📊 Tổng số tệp đã tải: $($treeItems.Count) tệp" -ForegroundColor Green
Write-Host "==============================================================" -ForegroundColor Green
Write-Host ""
