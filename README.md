# Vaultline — Cloud Storage Allocation Optimizer

> **0/1 Knapsack Dynamic Programming in Action**  
> Optimize real cloud storage allocations while exploring algorithm execution cell by cell.

---

## Overview

**Vaultline** solves two problems simultaneously:
1. **A genuinely useful practical tool**: Select or drop real files/folders from your computer, set your paid-storage quota, and obtain the provably optimal set of files to retain in paid storage with an exportable action plan (Bash & PowerShell archive scripts, CSV, JSON).
2. **An interactive teaching tool for an Analysis of Algorithms course**: Watch the classic 0/1 Knapsack Dynamic Programming algorithm execute step-by-step with synchronized pseudocode highlighting, cell dependency inspection, plain-English narration, ties handling, and traceback reconstruction.

---

## Problem Mapping

Vaultline translates the abstract **0/1 Knapsack Problem** into real-world cloud economics:

| Knapsack Parameter | Real-World Cloud Storage Concept |
| :--- | :--- |
| **Knapsack Capacity ($W$)** | **Paid Storage Quota** (e.g., 15 GB, 100 GB, 2 TB) |
| **Item ($i$)** | **File or Consolidated Folder** |
| **Weight ($w_i$)** | **File Size** (in bytes, rounded up to precision unit) |
| **Value ($v_i$)** | **Priority Score** (1 to 10 based on transparent file category & age rules) |
| **Decision $\{0, 1\}$** | **Binary Storage Decision**: Kept in Paid Cloud ($1$) vs. Archived/Moved ($0$) |
| **Objective** | **Maximize total priority score without exceeding the storage quota** |

---

## Architecture & Technology Stack

- **Frontend Core**: React 18, TypeScript, Vite, React Router (`HashRouter` for zero-server routing).
- **State Management**: Zustand store (`useAppStore.ts`) managing reactive computations, presets, filter state, and dark/light themes.
- **Visuals & Layout**:
  - `d3-hierarchy`: Computes squarified treemap tile dimensions without external charting wrappers.
  - `framer-motion`: Animated tile transitions, vault boundary packing, and spring layout transitions.
  - **Handwritten SVG**: All charts (Efficiency Quota Curve, Benchmark Scaling Chart) are rendered using native SVG elements.
- **Algorithms Engine (`/src/engine`)**: Zero-dependency pure TypeScript library containing:
  - `knapsack.ts`: High-performance bit-packed 0/1 solver + Step-recorded teaching engine.
  - `greedy.ts`: Density-based ($v/w$) heuristic knapsack + textbook counterexample dataset.
  - `bruteForce.ts`: $2^n$ exhaustive search for verification on $n \le 20$.
  - `selfTest.ts`: Automated random testing verifying 200 random small cases against $2^n$ brute force.
  - `normalizer.ts`: Conservative ceiling rounding ($w = \lceil \text{size} / \text{unit} \rceil$).
  - `fileUtils.ts`: Duplicate detection without reading file content, folder aggregation, and 500-item capping strategies.
  - `exportPlan.ts`: Bash script, PowerShell script, CSV, and JSON action plan generators.
  - `/variations`: Multiple-choice storage tiers (MCKP), continuous fractional knapsack, multiple buckets sequential DP, dual constraints (storage + bandwidth 2D slice), and FPTAS approximation.
- **Web Worker (`/src/workers`)**: Full mode 0/1 solver runs asynchronously off the UI thread via `solver.worker.ts`.
- **IndexedDB (`idb`)**: Scenarios and sessions persist locally in IndexedDB.

---

## Demo Mode vs Full Mode

| Capability | Teaching Mode ("Under the Hood") | Full Mode ("Workspace") |
| :--- | :--- | :--- |
| **Execution Thread** | Main UI Thread | Web Worker (Background thread) |
| **Scale Target** | Up to 8 items, $\le 25$ columns ($W$) | Up to 500 items, $\le 20,000$ columns ($W$) |
| **Memory Strategy** | Stores complete 2D matrix + step telemetry | Rolling 2-row values + bit-packed `Uint8Array` ($1.25\text{ MB}$ for $n=500, W=20,000$) |
| **Visualization** | Cell-by-cell table, dependencies, live English narration, traceback animation | Squarified Treemap into vault, Quota curve, breakdown tables |
| **Tie Handling** | Prefers fewer files, announces tie in plain English narration | Prefers fewer files using minimum-count tracking |

---

## How the File Picker Works

Vaultline reads **metadata only**: file name, relative path, byte size, MIME/extension, and last modified date. **File contents are never read or uploaded.**

1. **Drag-and-Drop Folder Scanning**:
   - Uses `DataTransferItem.webkitGetAsEntry()` to recursively traverse subfolders without reading file contents.
   - Yields in batches of 200 files using non-blocking microtasks (`await new Promise(r => setTimeout(r, 0))`) so scanning 50,000 files does not freeze the UI.
2. **Native Folder Scanner (File System Access API)**:
   - When available, uses `window.showDirectoryPicker()` for folder selection.
   - Automatically falls back to `<input type="file" webkitdirectory>` in non-supporting browsers.
3. **Duplicate Detection**:
   - Detects identical `(fileName, byteSize)` pairs without content hashing.
   - Provides a one-click **"Keep one, exclude the rest"** action.
4. **Folder Mode Aggregation**:
   - For massive directory trees, toggling **"By Folder"** aggregates files by top-level directory, weighting priority by byte size:
     $$\text{Priority}_{\text{folder}} = \frac{\sum (\text{size}_i \cdot \text{priority}_i)}{\sum \text{size}_i}$$

---

## Getting Started

### 1. Installation
```bash
npm install
```

### 2. Run Locally in Development
```bash
npm run dev
```
Navigate to `http://localhost:5173/`.

### 3. Run Automated Tests
```bash
npm test
```
Runs the Vitest suite:
- 500 randomized cases comparing DP against $2^n$ brute force
- Exact traceback equality verification
- Rounding ceiling validation ($\le \text{real quota}$)
- Pinned and excluded logic
- Textbook greedy counterexample verification ($30 \text{ vs } 48$)

### 4. Build Production Bundle
```bash
npm run build
```

---

## Classroom Presentation Features

- **Present Mode**: Top-bar toggle that increases font sizes, boosts contrast, and minimizes chrome for classroom projectors.
- **Self-Test Suite**: Instant one-click validation dialog showing 200 randomized small cases tested against brute-force in real time.
- **Keyboard Shortcuts**:
  - `Space`: Play / Pause playback
  - `→` (Right Arrow): Step forward
  - `←` (Left Arrow): Step backward
