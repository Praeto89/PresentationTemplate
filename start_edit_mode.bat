@echo off
cd /d "%~dp0"

REM Load Python configuration
call config.bat

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Python not found!
    echo.
    echo Attempting to install Python %PYTHON_VERSION%...
    echo.
    REM Download and install Python
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$url = '%PYTHON_URL%'; $output = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), '%PYTHON_INSTALLER_NAME%'); Write-Host 'Downloading Python...'; try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile($url, $output); Write-Host 'Running Python installer...'; Start-Process $output -ArgumentList '/quiet InstallAllUsers=1 PrependPath=1' -Wait; Write-Host 'Python installation complete!' } catch { Write-Host 'Failed to download Python. Please install manually from https://www.python.org'; exit 1 }"
    
    REM Check again after installation
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

echo Starting Edit Mode...
echo.
echo Starting Save Server on port 8001...
start "Save Server" cmd /k python save_server.py
timeout /t 2 /nobreak
echo.
echo Starting Live Server on port 8000...
start "Live Server" cmd /k python -m http.server 8000
timeout /t 2 /nobreak
echo.
echo Opening browser in edit mode...
timeout /t 1 /nobreak
start http://localhost:8000/index.html?mode=edit
echo.
echo Edit Mode started!
echo - Save Server running on port 8001
echo - Live Server running on port 8000
echo - Open http://localhost:8000/index.html?mode=edit in your browser
echo.
echo Press any key to exit...
pause
