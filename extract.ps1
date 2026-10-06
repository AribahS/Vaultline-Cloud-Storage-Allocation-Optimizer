$outDir = "C:\Users\Admin\AOA\temp_restore"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function Extract-Transcript($path, $prefix) {
    $lines = Get-Content $path
    foreach ($line in $lines) {
        if ($line -match "write_to_file" -or $line -match "replace_file_content") {
            try {
                $obj = $line | ConvertFrom-Json
                if ($obj.tool_calls) {
                    foreach ($tool in $obj.tool_calls) {
                        if ($tool.name -eq "write_to_file" -and $tool.args.TargetFile) {
                            $content = $tool.args.CodeContent
                            $target = $tool.args.TargetFile
                            $name = [System.IO.Path]::GetFileName($target)
                            Set-Content -Path "$outDir\${prefix}_$name" -Value $content
                        }
                    }
                }
            } catch {}
        }
    }
}

Extract-Transcript "C:\Users\Admin\.gemini\antigravity-ide\brain\58d6d100-1ef2-417e-9cc0-0ec0a536f842\.system_generated\logs\transcript_full.jsonl" "Sep30"
Extract-Transcript "C:\Users\Admin\.gemini\antigravity-ide\brain\cffea7ca-10d2-45dd-9014-504abe736f18\.system_generated\logs\transcript_full.jsonl" "Oct5"

Get-ChildItem $outDir | Select-Object Name, Length
