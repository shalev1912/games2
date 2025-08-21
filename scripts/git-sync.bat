@echo off
setlocal enabledelayedexpansion
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0git-sync.ps1" %*
set EXITCODE=%ERRORLEVEL%
if %EXITCODE% neq 0 (
	echo [ERR] Git sync failed with exit code %EXITCODE%.
) else (
	echo [OK] Git sync completed successfully.
)
exit /b %EXITCODE%

