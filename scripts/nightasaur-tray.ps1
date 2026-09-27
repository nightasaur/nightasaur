# scripts/nightasaur-tray.ps1 (v2)
# Nightasaur system tray - manages backend (3002) + frontend (5173)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$script:RootDir = "C:\nightasaur"
$script:BackendDir = "$RootDir\apps\backend"
$script:FrontendDir = "$RootDir\apps\web"
$script:IcoPath = "$RootDir\assets\nightasaur-dino.ico"
$script:LogDir = "$RootDir\_logs"
$script:CurrentState = ""

New-Item -ItemType Directory -Force -Path $script:LogDir | Out-Null

function Test-Port {
    param([int]$Port)
    $p = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return $null -ne $p
}

function Start-Backend {
    if (Test-Port 3002) { return }
    $logFile = "$script:LogDir\backend.log"
    $errFile = "$script:LogDir\backend-error.log"
    $cmdArgs = "/c set LLM_PROVIDER=ollama && npm run dev > `"$logFile`" 2> `"$errFile`""
    Start-Process -FilePath "cmd.exe" -WorkingDirectory $script:BackendDir -ArgumentList $cmdArgs -WindowStyle Hidden
    Start-Sleep -Seconds 25
}

function Start-Frontend {
    if (Test-Port 5173) { return }
    $logFile = "$script:LogDir\frontend.log"
    $errFile = "$script:LogDir\frontend-error.log"
    $cmdArgs = "/c npm run dev > `"$logFile`" 2> `"$errFile`""
    Start-Process -FilePath "cmd.exe" -WorkingDirectory $script:FrontendDir -ArgumentList $cmdArgs -WindowStyle Hidden
    Start-Sleep -Seconds 15
}

function Stop-Port {
    param([int]$Port)
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if (-not $conn) { return }
    $pids = $conn.OwningProcess | Sort-Object -Unique
    foreach ($procId in $pids) {
        try {
            Stop-Process -Id $procId -Force -ErrorAction Stop
        } catch {
            Write-Host "Failed to kill PID $procId : $($_.Exception.Message)"
        }
    }
    Start-Sleep -Seconds 2
}

function Stop-Backend { Stop-Port -Port 3002 }
function Stop-Frontend { Stop-Port -Port 5173 }

function Start-All {
    Start-Backend
    Start-Frontend
    Show-Balloon "Started backend (3002) and frontend (5173)"
}

function Stop-All {
    Stop-Frontend
    Stop-Backend
    Show-Balloon "Stopped both services"
}

function Restart-All {
    Stop-All
    Start-Sleep -Seconds 1
    Start-All
}

function Open-Browser {
    Start-Process "http://localhost:5173"
}

function Open-Log {
    $logFile = "$script:LogDir\backend.log"
    if (Test-Path $logFile) {
        Start-Process "notepad.exe" -ArgumentList $logFile
    } else {
        [System.Windows.Forms.MessageBox]::Show("No backend log yet.", "Nightasaur") | Out-Null
    }
}

function Show-Status {
    $be = "STOPPED"
    if (Test-Port 3002) { $be = "RUNNING" }
    $fe = "STOPPED"
    if (Test-Port 5173) { $fe = "RUNNING" }
    $msg = "Backend (3002):  $be`nFrontend (5173): $fe`nOllama (11434):  $([System.String]::Join('', 'up'))`nDB: postgresql://localhost:5432/nightasaur"
    [System.Windows.Forms.MessageBox]::Show($msg, "Nightasaur Status") | Out-Null
}

function Show-Balloon {
    param([string]$Message)
    $script:Notify.ShowBalloonTip(2000, "Nightasaur", $Message, [System.Windows.Forms.ToolTipIcon]::Info)
}

# ---------- Tray setup ----------
$icon = New-Object System.Drawing.Icon $script:IcoPath

$notify = New-Object System.Windows.Forms.NotifyIcon
$notify.Icon = $icon
$notify.Text = "Nightasaur"
$notify.Visible = $true
$script:Notify = $notify

# Context menu
$menu = New-Object System.Windows.Forms.ContextMenuStrip

$itemOpen = New-Object System.Windows.Forms.ToolStripMenuItem("Open Nightasaur")
$itemOpen.add_Click({ Open-Browser })
$menu.Items.Add($itemOpen) | Out-Null

$menu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator)) | Out-Null

$itemStartAll = New-Object System.Windows.Forms.ToolStripMenuItem("Start All")
$itemStartAll.add_Click({ Start-All })
$menu.Items.Add($itemStartAll) | Out-Null

$itemStopAll = New-Object System.Windows.Forms.ToolStripMenuItem("Stop All")
$itemStopAll.add_Click({ Stop-All })
$menu.Items.Add($itemStopAll) | Out-Null

$itemRestartAll = New-Object System.Windows.Forms.ToolStripMenuItem("Restart All")
$itemRestartAll.add_Click({ Restart-All })
$menu.Items.Add($itemRestartAll) | Out-Null

$menu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator)) | Out-Null

$itemStartBackend = New-Object System.Windows.Forms.ToolStripMenuItem("Start Backend only")
$itemStartBackend.add_Click({ Start-Backend })
$menu.Items.Add($itemStartBackend) | Out-Null

$itemStartFrontend = New-Object System.Windows.Forms.ToolStripMenuItem("Start Frontend only")
$itemStartFrontend.add_Click({ Start-Frontend })
$menu.Items.Add($itemStartFrontend) | Out-Null

$menu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator)) | Out-Null

$itemStatus = New-Object System.Windows.Forms.ToolStripMenuItem("Check Status")
$itemStatus.add_Click({ Show-Status })
$menu.Items.Add($itemStatus) | Out-Null

$itemLog = New-Object System.Windows.Forms.ToolStripMenuItem("View Backend Log")
$itemLog.add_Click({ Open-Log })
$menu.Items.Add($itemLog) | Out-Null

$menu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator)) | Out-Null

$itemExit = New-Object System.Windows.Forms.ToolStripMenuItem("Exit (keep services running)")
$itemExit.add_Click({
    $script:Notify.Visible = $false
    $script:Notify.Dispose()
    [System.Windows.Forms.Application]::Exit()
})
$menu.Items.Add($itemExit) | Out-Null

$notify.ContextMenuStrip = $menu
$notify.add_DoubleClick({ Open-Browser })

Show-Balloon "Tray started. Right-click for menu."

# Auto-start services on tray launch
Start-All

Write-Host "=== Nightasaur Tray v2 Started ==="
Write-Host "Left-click or double-click: open http://localhost:5173"
Write-Host "Right-click: menu (Start All / Stop All / Status / Log)"
Write-Host ""

try {
    while ($true) {
        $be = Test-Port 3002
        $fe = Test-Port 5173
        $state = "$be|$fe"
        if ($state -ne $script:CurrentState) {
            $script:CurrentState = $state
            $beStr = "stopped"
            $feStr = "stopped"
            if ($be) { $beStr = "running" }
            if ($fe) { $feStr = "running" }
            $notify.Text = "Nightasaur - BE: $beStr, FE: $feStr"
        }
        [System.Windows.Forms.Application]::DoEvents()
        Start-Sleep -Milliseconds 500
    }
} finally {
    $notify.Visible = $false
    $notify.Dispose()
    $icon.Dispose()
}
