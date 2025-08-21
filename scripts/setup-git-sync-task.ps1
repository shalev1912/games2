param(
	[int]$EveryMinutes = 10,
	[switch]$Remove
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Info($text) { Write-Host "[INFO] $text" -ForegroundColor Cyan }
function Write-Ok($text) { Write-Host "[OK]   $text" -ForegroundColor Green }
function Write-Warn($text) { Write-Host "[WARN] $text" -ForegroundColor Yellow }
function Write-Err($text) { Write-Host "[ERR]  $text" -ForegroundColor Red }

try {
	$taskName = 'Games2GitSync'
	$gitSyncScript = Join-Path $PSScriptRoot 'git-sync.ps1'
	if (-not (Test-Path $gitSyncScript)) {
		throw "git-sync.ps1 not found at $gitSyncScript"
	}

	if ($Remove) {
		$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
		if ($existing) {
			Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
			Write-Ok "Removed scheduled task '$taskName'"
		} else {
			Write-Warn "Scheduled task '$taskName' was not found"
		}
		return
	}

	# Build action and trigger
	$escapedScript = $gitSyncScript.Replace('"','\"')
	$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument ("-NoProfile -ExecutionPolicy Bypass -File `"$escapedScript`" `"scheduled sync`"")
	$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes $EveryMinutes) -RepetitionDuration (New-TimeSpan -Days 3650)
	$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType InteractiveToken -RunLevel Limited

	# Re-create if exists
	$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
	if ($existing) {
		Unregister-ScheduledTask -TaskName $taskName -Confirm:$false | Out-Null
	}

	Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal | Out-Null
	Write-Ok "Scheduled task '$taskName' created to run every $EveryMinutes minutes"
}
catch {
	Write-Err $_.Exception.Message
	throw
}

