# Recreate the static sharing card on Windows; no external dependencies.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$bitmap = [System.Drawing.Bitmap]::new(1200, 630)
$canvas = [System.Drawing.Graphics]::FromImage($bitmap)
$resources = [System.Collections.Generic.List[System.IDisposable]]::new()
function New-CardBrush([string]$hex) {
    $brush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($hex))
    $resources.Add($brush)
    return $brush
}
function New-CardFont([int]$size, [System.Drawing.FontStyle]$style = [System.Drawing.FontStyle]::Regular) {
    $font = [System.Drawing.Font]::new('Segoe UI', $size, $style, [System.Drawing.GraphicsUnit]::Pixel)
    $resources.Add($font)
    return $font
}
try {
    $canvas.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $canvas.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $canvas.Clear([System.Drawing.ColorTranslator]::FromHtml('#101719'))
    $grid = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml('#1b2929'), 1)
    $resources.Add($grid)
    for ($x = 0; $x -lt 1200; $x += 48) { $canvas.DrawLine($grid, $x, 0, $x, 630) }
    for ($y = 0; $y -lt 630; $y += 48) { $canvas.DrawLine($grid, 0, $y, 1200, $y) }
    $mint = New-CardBrush '#8fe5c2'
    $white = New-CardBrush '#edf3f2'
    $muted = New-CardBrush '#afbfbd'
    $panel = New-CardBrush '#172124'
    $canvas.FillRectangle($mint, 72, 80, 64, 5)
    $canvas.DrawString('GAMEPLAY PROGRAMMER / LONDON', (New-CardFont 22 Bold), $mint, 72, 120)
    $canvas.DrawString('Dean Isseyegh', (New-CardFont 82 Bold), $white, 66, 185)
    $canvas.DrawString('A decade of engineering. A lifetime of games.', (New-CardFont 30), $muted, 72, 300)
    $canvas.FillRectangle($panel, 72, 395, 1056, 64)
    $canvas.DrawString('Commercial games   /   Solo projects   /   Game jams', (New-CardFont 26), $white, 94, 410)
    $canvas.DrawString('deanthegamedev.com', (New-CardFont 24), $mint, 72, 522)
    $canvas.FillRectangle($mint, 0, 624, 1200, 6)
    $outputPath = Join-Path $PSScriptRoot '../assets/png/social-preview.png'
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Output "Generated $outputPath (1200 x 630)"
} finally {
    foreach ($resource in $resources) { $resource.Dispose() }
    $canvas.Dispose()
    $bitmap.Dispose()
}
