@echo off
cd /d "%~dp0"

REM ══════════════════════════════════════════════════════════════════
REM  Presentation starten (Ein-Klick-Start)
REM  Startet den Unified Server und oeffnet den Browser
REM ══════════════════════════════════════════════════════════════════

REM Load Python configuration
call config.bat

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Python not found!
    echo.
    echo Attempting to install Python %PYTHON_VERSION%...
    echo.
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$url = '%PYTHON_URL%'; $output = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), '%PYTHON_INSTALLER_NAME%'); Write-Host 'Downloading Python...'; try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile($url, $output); Write-Host 'Running Python installer...'; Start-Process $output -ArgumentList '/quiet InstallAllUsers=1 PrependPath=1' -Wait; Write-Host 'Python installation complete!' } catch { Write-Host 'Failed to download Python. Please install manually from https://www.python.org'; exit 1 }"
    
    python --version >nul 2>&1
    if errorlevel 1 (
        echo.
        echo ERROR: Python installation failed!
        echo Please install Python manually from https://www.python.org
        echo Make sure to check "Add Python to PATH"
        pause
        exit /b 1
    )
)

echo.
echo  Starting Presentation Server...
echo  ================================
echo.

start "Presentation Server" cmd /k python server.py
timeout /t 3 /nobreak >nul
start http://localhost:8000

echo  Server laeuft auf http://localhost:8000
echo  Edit-Mode: Ctrl+E oder den Stift-Button klicken
echo.
echo  Dieses Fenster kann geschlossen werden.
pause
