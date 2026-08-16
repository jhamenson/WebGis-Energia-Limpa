[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$dataPath = "C:\Users\jhame\.gemini\antigravity\scratch\geoportal-webgis\data"
$outJsPath = "C:\Users\jhame\.gemini\antigravity\scratch\geoportal-webgis\js\embedded-data.js"

$tiRaw = [System.IO.File]::ReadAllText((Join-Path $dataPath "terras_indigenas.geojson"), [System.Text.Encoding]::UTF8)
$aldRaw = [System.IO.File]::ReadAllText((Join-Path $dataPath "pontos_aldeias.geojson"), [System.Text.Encoding]::UTF8)
$areaRaw = [System.IO.File]::ReadAllText((Join-Path $dataPath "area_de_estudo.geojson"), [System.Text.Encoding]::UTF8)
$riosRaw = [System.IO.File]::ReadAllText((Join-Path $dataPath "area_de_estudo_rios.geojson"), [System.Text.Encoding]::UTF8)

$writer = [System.IO.File]::CreateText($outJsPath)
$writer.WriteLine("/**")
$writer.WriteLine(" * Pre-bundled WebGIS GeoJSON Datasets (WGS84 / SIRGAS 2000 Compatible)")
$writer.WriteLine(" * Projeto: Energia Limpa (All 4 Layers included with Buffer / Study Area)")
$writer.WriteLine(" */")
$writer.WriteLine("window.EMBEDDED_DATA = {")
$writer.Write("  terrasIndigenas: ")
$writer.Write($tiRaw)
$writer.WriteLine(",")
$writer.Write("  aldeias: ")
$writer.Write($aldRaw)
$writer.WriteLine(",")
$writer.Write("  areaEstudo: ")
$writer.Write($areaRaw)
$writer.WriteLine(",")
$writer.Write("  rios: ")
$writer.Write($riosRaw)
$writer.WriteLine("};")
$writer.Flush()
$writer.Close()

Write-Host "Re-bundled embedded-data.js with Buffer layer! Size: $((Get-Item $outJsPath).Length) bytes"
