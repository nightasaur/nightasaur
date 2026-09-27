' scripts/nightasaur-tray.vbs
' Launch Nightasaur Tray with no window
CreateObject("WScript.Shell").Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -File ""C:\nightasaur\scripts\nightasaur-tray.ps1""", 0, False