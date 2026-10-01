param([string]$Root = "", [int]$Port = 8123)

if ($Root -eq "") {
  $base = Split-Path -Parent $MyInvocation.MyCommand.Path
  if (Test-Path -LiteralPath (Join-Path $base 'index.html')) {
    $Root = $base
  } else {
    $trouve = Get-ChildItem -LiteralPath $base -Directory |
      Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'index.html') } |
      Select-Object -First 1
    if ($trouve) {
      $Root = $trouve.FullName
    } else {
      Write-Output "Aucun index.html trouve dans $base ni dans ses sous-dossiers."
      Read-Host "Appuyez sur Entree pour fermer"
      exit 1
    }
  }
}
$Root = [System.IO.Path]::GetFullPath($Root)

$types = @{
  '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8';
  '.json'='application/json; charset=utf-8'; '.png'='image/png'; '.jpg'='image/jpeg';
  '.mp3'='audio/mpeg'; '.ogg'='audio/ogg'; '.css'='text/css; charset=utf-8';
  '.tmx'='application/xml'; '.svg'='image/svg+xml'; '.md'='text/plain; charset=utf-8'
}

$listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()
Write-Output "serving $Root on http://localhost:$Port/"

while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $stream = $client.GetStream()
    $buf = New-Object byte[] 8192
    $stream.ReadTimeout = 5000
    $read = $stream.Read($buf, 0, $buf.Length)
    if ($read -le 0) { $client.Close(); continue }
    $req = [System.Text.Encoding]::ASCII.GetString($buf, 0, $read)
    $line = ($req -split "`r?`n")[0]
    $parts = $line -split ' '
    if ($parts.Count -lt 2) { $client.Close(); continue }
    $path = $parts[1]
    $path = ($path -split '\?')[0]
    $path = [System.Uri]::UnescapeDataString($path)
    if ($path -eq '/') { $path = '/index.html' }
    $rel = $path.TrimStart('/').Replace('/', '\')
    $full = Join-Path $Root $rel
    $fullResolved = [System.IO.Path]::GetFullPath($full)

    if ($fullResolved.StartsWith([System.IO.Path]::GetFullPath($Root)) -and (Test-Path -LiteralPath $fullResolved -PathType Leaf)) {
      $bytes = [System.IO.File]::ReadAllBytes($fullResolved)
      $ext = [System.IO.Path]::GetExtension($fullResolved).ToLower()
      $ct = $types[$ext]; if (-not $ct) { $ct = 'application/octet-stream' }
      $head = "HTTP/1.1 200 OK`r`nContent-Type: $ct`r`nContent-Length: $($bytes.Length)`r`nCache-Control: no-store`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`n`r`n"
      Write-Output "200 $path"
    } else {
      $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $path")
      $head = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`n`r`n"
      Write-Output "404 $path"
    }
    $headBytes = [System.Text.Encoding]::ASCII.GetBytes($head)
    $stream.Write($headBytes, 0, $headBytes.Length)
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Flush()
  } catch {
    Write-Output "err $($_.Exception.Message)"
  } finally {
    $client.Close()
  }
}
