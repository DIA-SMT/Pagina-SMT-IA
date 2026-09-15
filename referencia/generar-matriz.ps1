# Genera docs/matriz-funcional.md a partir de los resultados del relevamiento
$ErrorActionPreference = 'Stop'
$dir = "C:\Users\lucas\.claude\projects\C--Users-lucas-Trabajo-Proyectos-Dia-Pagina-Smt\f0fc790e-0e7b-4289-a8ce-afa96a79c9c9\subagents\workflows\wf_90f1e2ec-2cd"

$rows = @()
$notas = @()
# Windows PowerShell 5.1 lee ANSI por defecto: forzar UTF-8 o el texto se corrompe.
Get-Content "$dir\journal.jsonl" -Encoding UTF8 | ForEach-Object {
    $j = $_ | ConvertFrom-Json
    if ($j.type -eq 'result' -and $j.result -and $j.result.rows) {
        $rows += $j.result.rows
        if ($j.result.notas) { $notas += $j.result.notas }
    }
}

function Esc([string]$s) {
    if (-not $s) { return '—' }
    return ($s -replace '\|', '\|' -replace "`r?`n", ' ').Trim()
}

$out = New-Object System.Collections.Generic.List[string]
$out.Add('# Matriz funcional del portal smt.gob.ar')
$out.Add('')
$out.Add("Relevamiento público del 14/09/2026 con $($rows.Count) filas. Estados: **verificado** (la página respondió y fue descripta), **pendiente de verificación** (no respondió o no pudo confirmarse: NO se asume que dejó de existir), **roto aparente** (error claro reproducido).")
$out.Add('')

# Resumen por estado
$grupos = $rows | Group-Object estado | Sort-Object Count -Descending
$out.Add('| Estado | Filas |')
$out.Add('|---|---|')
foreach ($g in $grupos) { $out.Add("| $($g.Name) | $($g.Count) |") }
$out.Add('')

$out.Add('| Sección o función | URL actual | Comportamiento | Origen de los datos | Dependencia | Solución propuesta | Estado |')
$out.Add('|---|---|---|---|---|---|---|')
foreach ($r in $rows) {
    $out.Add("| $(Esc $r.seccion) | $(Esc $r.url) | $(Esc $r.comportamiento) | $(Esc $r.origen_datos) | $(Esc $r.dependencia) | $(Esc $r.propuesta) | $(Esc $r.estado) |")
}
$out.Add('')
$out.Add('## Notas de los relevamientos (contradicciones y datos a validar)')
$out.Add('')
foreach ($n in $notas) { $out.Add("- $(Esc $n)"); $out.Add('') }

[System.IO.File]::WriteAllLines("$PWD\docs\matriz-funcional.md", $out, (New-Object System.Text.UTF8Encoding $false))
"Matriz generada: $($rows.Count) filas, $($notas.Count) bloques de notas"
