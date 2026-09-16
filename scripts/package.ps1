$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$archivePath = Join-Path $projectRoot 'ARRA-website-Apache.zip'
$expectedArchive = [IO.Path]::GetFullPath($archivePath)
if ([IO.Path]::GetDirectoryName($expectedArchive) -ne $projectRoot -or [IO.Path]::GetFileName($expectedArchive) -ne 'ARRA-website-Apache.zip') { throw 'Unexpected archive target.' }
$rootFiles = @('index.html','confidentialitate.html','404.html','.htaccess','robots.txt','sitemap.xml')
$assetRoot = [IO.Path]::GetFullPath((Join-Path $projectRoot 'assets'))
$files = @($rootFiles | ForEach-Object { Get-Item -LiteralPath (Join-Path $projectRoot $_) }) + @(Get-ChildItem -LiteralPath $assetRoot -Recurse -File)
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
# Overwrite only our explicitly named generated artifact; no source files are deleted.
$stream = [IO.File]::Open($expectedArchive,[IO.FileMode]::Create)
$zip = New-Object IO.Compression.ZipArchive($stream,[IO.Compression.ZipArchiveMode]::Create,$false)
try {
  foreach ($file in $files) {
    $entryName = $file.FullName.Substring($projectRoot.Length + 1).Replace('\','/')
    [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,$file.FullName,$entryName,[IO.Compression.CompressionLevel]::Optimal) | Out-Null
  }
} finally { $zip.Dispose(); $stream.Dispose() }
$readZip = [IO.Compression.ZipFile]::OpenRead($expectedArchive)
try {
  if ($readZip.Entries.Count -ne $files.Count) { throw 'Archive entry count mismatch.' }
  foreach ($name in $rootFiles) { if (!$readZip.GetEntry($name)) { throw "Missing archive entry: $name" } }
  if ($readZip.Entries | Where-Object { $_.FullName -match '(^|/)(test-form|scripts|qa|media_website_selectie)' }) { throw 'Non-public file in archive.' }
  Write-Output "Verified $($readZip.Entries.Count) public files in $expectedArchive"
} finally { $readZip.Dispose() }
$archiveInfo = Get-Item -LiteralPath $expectedArchive
Write-Output ('Archive size: {0:N2} MB' -f ($archiveInfo.Length / 1MB))
