# scripts/install-tray-shortcut.ps1
# Creates desktop shortcut for Nightasaur Tray

$WshShell = New-Object -ComObject WScript.Shell
$Desktop = [System.Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $Desktop "Nightasaur Talk.lnk"

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"C:\nightasaur\scripts\nightasaur-tray.ps1`""
$Shortcut.WorkingDirectory = "C:\nightasaur"
$Shortcut.IconLocation = "C:\nightasaur\assets\nightasaur-dino.ico"
$Shortcut.Description = "Nightasaur AI Spirit Assistant"
$Shortcut.Save()

Write-Host "Created shortcut: $ShortcutPath"
Write-Host ""
Write-Host "Double-click 'Nightasaur Talk' on your desktop to start the tray app."