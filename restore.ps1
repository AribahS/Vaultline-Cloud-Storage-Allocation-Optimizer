$src = "C:\Users\Admin\AOA\temp_restore"
$dest = "C:\Users\Admin\AOA\src"

# Remove redesign files
if (Test-Path "$dest\lib") { Remove-Item -Recurse -Force "$dest\lib" }
if (Test-Path "$dest\ui\pages\PlayPage.tsx") { Remove-Item -Force "$dest\ui\pages\PlayPage.tsx" }

# Make sure tools directory exists
New-Item -ItemType Directory -Force -Path "$dest\ui\pages\tools" | Out-Null

# Copy files
Copy-Item "$src\Sep30_App.tsx" "$dest\App.tsx" -Force
Copy-Item "$src\Oct5_AppShell.tsx" "$dest\ui\components\AppShell.tsx" -Force
Copy-Item "$src\Oct5_ToolsPage.tsx" "$dest\ui\pages\ToolsPage.tsx" -Force
Copy-Item "$src\Oct5_DashboardPage.tsx" "$dest\ui\pages\DashboardPage.tsx" -Force
Copy-Item "$src\Oct5_Sidebar.tsx" "$dest\ui\components\Sidebar.tsx" -Force
Copy-Item "$src\Oct5_TopBar.tsx" "$dest\ui\components\TopBar.tsx" -Force
Copy-Item "$src\Oct5_OptimizerPage.tsx" "$dest\ui\pages\OptimizerPage.tsx" -Force
Copy-Item "$src\Sep30_AlgorithmPage.tsx" "$dest\ui\pages\AlgorithmPage.tsx" -Force
Copy-Item "$src\Oct5_ReportsPage.tsx" "$dest\ui\pages\ReportsPage.tsx" -Force
Copy-Item "$src\Oct5_SettingsModal.tsx" "$dest\ui\components\SettingsModal.tsx" -Force
Copy-Item "$src\Oct5_VaultGauge.tsx" "$dest\ui\components\VaultGauge.tsx" -Force
Copy-Item "$src\Oct5_KpiCard.tsx" "$dest\ui\components\KpiCard.tsx" -Force
Copy-Item "$src\Oct5_StackedBar.tsx" "$dest\ui\components\StackedBar.tsx" -Force
Copy-Item "$src\Oct5_Card.tsx" "$dest\ui\components\Card.tsx" -Force

Copy-Item "$src\Sep30_SplitTool.tsx" "$dest\ui\pages\tools\SplitTool.tsx" -Force
Copy-Item "$src\Sep30_TransferTool.tsx" "$dest\ui\pages\tools\TransferTool.tsx" -Force
Copy-Item "$src\Sep30_CompressionTool.tsx" "$dest\ui\pages\tools\CompressionTool.tsx" -Force
Copy-Item "$src\Sep30_WhatIfTool.tsx" "$dest\ui\pages\tools\WhatIfTool.tsx" -Force
Copy-Item "$src\Sep30_ApproximateTool.tsx" "$dest\ui\pages\tools\ApproximateTool.tsx" -Force
Copy-Item "$src\Sep30_CleanupTool.tsx" "$dest\ui\pages\tools\CleanupTool.tsx" -Force

Copy-Item "$src\Sep30_LandingPage.tsx" "$dest\ui\pages\LandingPage.tsx" -Force
Copy-Item "$src\Sep30_FilesPage.tsx" "$dest\ui\pages\FilesPage.tsx" -Force

Write-Host "Restoration complete."
