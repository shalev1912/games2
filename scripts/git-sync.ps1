# Requires: Git installed and repository already initialized with a remote

param(
	[string]$Message = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Info($text) { Write-Host "[INFO] $text" -ForegroundColor Cyan }
function Write-Ok($text) { Write-Host "[OK]   $text" -ForegroundColor Green }
function Write-Warn($text) { Write-Host "[WARN] $text" -ForegroundColor Yellow }
function Write-Err($text) { Write-Host "[ERR]  $text" -ForegroundColor Red }

try {
	# Move to repository root (this script lives in scripts/)
	$repoRoot = Split-Path -Parent $PSScriptRoot
	Set-Location $repoRoot

	# Check git availability
	git --version | Out-Null
	Write-Info "Using $(git --version)"

	# Confirm there is a remote
	$remotes = git remote
	if (-not $remotes) {
		throw "No git remote configured. Run: git remote add origin <URL>"
	}

	# Make sure we have the current branch
	$currentBranch = (git rev-parse --abbrev-ref HEAD).Trim()
	Write-Info "Current branch: $currentBranch"

	# Pull latest (rebase) before committing to minimize conflicts (only if upstream exists)
	$hasUpstream = $true
	try {
		git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>$null | Out-Null
		if ($LASTEXITCODE -ne 0) { $hasUpstream = $false }
	} catch { $hasUpstream = $false }

	if ($hasUpstream) {
		Write-Info "Pulling latest changes (rebase) from remote..."
		git pull --rebase | Out-Null
		Write-Ok "Pull complete"
	} else {
		Write-Warn "No upstream tracking branch. Skipping pull."
	}

	# Stage all changes
	Write-Info "Staging changes..."
	git add -A

	# Determine if there is anything to commit
	git diff --cached --quiet
	$hasStaged = ($LASTEXITCODE -ne 0)
	if ($hasStaged) {
		# Build commit message
		$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
		if ([string]::IsNullOrWhiteSpace($Message)) {
			$commitMessage = "chore(sync): update at $timestamp"
		} else {
			$commitMessage = "chore(sync): $Message ($timestamp)"
		}

		Write-Info "Committing: $commitMessage"
		git commit -m "$commitMessage" | Out-Null
		Write-Ok "Commit created"
	} else {
		Write-Warn "No changes to commit"
	}

	# Push regardless, in case new commits exist locally
	Write-Info "Pushing to remote..."
	if ($hasUpstream) {
		git push | Out-Null
	} else {
		git push -u origin $currentBranch | Out-Null
	}
	Write-Ok "Push complete"

	exit 0
}
catch {
	Write-Err $_.Exception.Message
	exit 1
}

