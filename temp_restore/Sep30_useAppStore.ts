import { create } from 'zustand';
import { FileMetadata, KnapsackResult, KnapsackItem } from '../engine/types';
import { DEFAULT_PRIORITY_RULES, recalculateFilePriorities, PriorityRuleConfig } from '../engine/priority';
import { BYTE_UNITS, resolveUnitBytes, normaliseQuota, normaliseItemSize, RoundingUnitOption } from '../engine/normalizer';
import { STUDENT_LAPTOP_DATASET, PHOTOGRAPHER_DATASET, COMPANY_SERVER_DATASET } from '../data/sampleDatasets';
import { markDuplicates, resolveDuplicatesKeepOne, aggregateFolders, applyCapStrategy, CapStrategy } from '../engine/fileUtils';
import { runFullKnapsackAsync } from '../workers/solverClient';
import { saveAutoSession } from '../engine/storageDb';
import { ProfileId, ProfileToggles, applyProfileToFiles } from '../engine/profiles';
import { StoragePlace } from '../engine/multiPlace';

export type PresetType = 'student' | 'photographer' | 'company';

export interface PlanSnapshot {
  name: string;
  quotaBytes: number;
  keptIds: string[];
  totalValue: number;
  totalSize: number;
  savedAt: number;
}

export interface AppState {
  // Theme & presentation
  theme: 'dark' | 'light';
  isPresentMode: boolean;
  toggleTheme: () => void;
  togglePresentMode: () => void;

  // Global complexity toggle: Simple vs Detailed
  complexityMode: 'simple' | 'detailed';
  setComplexityMode: (mode: 'simple' | 'detailed') => void;

  // File metadata & structure
  files: FileMetadata[];
  isScanning: boolean;
  scanProgress: { count: number; currentFolder?: string } | null;
  folderMode: boolean;
  capStrategy: CapStrategy;

  // Filter & search
  searchQuery: string;
  categoryFilter: string;
  sortBy: 'size' | 'priority' | 'date' | 'name';
  sortOrder: 'asc' | 'desc';

  // Quota & storage places
  quotaBytes: number;
  quotaUnitOption: RoundingUnitOption;
  priorityRules: PriorityRuleConfig;
  places: StoragePlace[];

  // Importance profiles & toggles
  profileId: ProfileId;
  profileToggles: ProfileToggles;

  // Packing mode: Auto (Vaultline) vs Manual (Pack it yourself)
  packingMode: 'auto' | 'manual';
  manualKeptIds: string[];

  // Plan comparison
  savedPlanA: PlanSnapshot | null;

  // Algorithm Result
  isComputing: boolean;
  knapsackResult: KnapsackResult | null;
  lastComputeError: string | null;

  // Actions
  setFiles: (files: FileMetadata[]) => void;
  addFiles: (newFiles: FileMetadata[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  togglePin: (id: string) => void;
  toggleExclude: (id: string) => void;
  setFilePlacement: (id: string, placement: 'always_keep' | 'auto' | 'never_keep') => void;
  setFileImportanceTier: (id: string, tier: 'important' | 'normal' | 'can_go') => void;
  bulkSetPlacement: (ids: string[], placement: 'always_keep' | 'auto' | 'never_keep') => void;
  bulkSetImportance: (ids: string[], priority: number) => void;
  updatePriority: (id: string, priority: number) => void;
  loadPreset: (type: PresetType) => void;
  deduplicateKeepOneAction: () => void;
  setFolderMode: (enabled: boolean) => void;
  setCapStrategy: (strategy: CapStrategy) => void;
  setSearchQuery: (q: string) => void;
  setCategoryFilter: (cat: string) => void;
  setSort: (by: 'size' | 'priority' | 'date' | 'name', order?: 'asc' | 'desc') => void;
  setQuotaBytes: (bytes: number) => void;
  setRoundingUnitOption: (opt: RoundingUnitOption) => void;
  setPriorityRules: (rules: PriorityRuleConfig) => void;
  setProfile: (id: ProfileId) => void;
  setProfileToggle: (key: keyof ProfileToggles, value: boolean) => void;
  setPackingMode: (mode: 'auto' | 'manual') => void;
  toggleManualKept: (id: string) => void;
  saveCurrentAsPlanA: () => void;
  clearPlanA: () => void;
  addPlace: (place: StoragePlace) => void;
  removePlace: (id: string) => void;
  updatePlace: (id: string, updates: Partial<StoragePlace>) => void;
  recalculatePrioritiesAction: () => void;
  setIsScanning: (scanning: boolean, progress?: { count: number; currentFolder?: string } | null) => void;
  triggerRecompute: () => Promise<void>;
}

// Default initial dataset
const initialFiles = markDuplicates(STUDENT_LAPTOP_DATASET);
const initialQuota = 15 * BYTE_UNITS.GB;

let computeTimer: any = null;

export const useAppStore = create<AppState>((set, get) => ({
  theme: 'light',
  isPresentMode: false,
  toggleTheme: () => {
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', nextTheme);
      }
      return { theme: nextTheme };
    });
  },
  togglePresentMode: () => {
    set((state) => ({ isPresentMode: !state.isPresentMode }));
  },

  complexityMode: 'simple',
  setComplexityMode: (complexityMode) => set({ complexityMode }),

  files: initialFiles,
  isScanning: false,
  scanProgress: null,
  folderMode: false,
  capStrategy: 'largest_500',

  searchQuery: '',
  categoryFilter: 'all',
  sortBy: 'size',
  sortOrder: 'desc',

  quotaBytes: initialQuota,
  quotaUnitOption: 'auto',
  priorityRules: DEFAULT_PRIORITY_RULES,
  places: [
    { id: 'p1', name: 'Primary Storage', quotaBytes: initialQuota, color: 'var(--color-primary)' },
  ],

  profileId: 'balanced',
  profileToggles: {
    newerFilesMatterMore: false,
    rareBigFilesMatterLess: false,
    documentsMatterMore: false,
  },

  packingMode: 'auto',
  manualKeptIds: [],

  savedPlanA: null,

  isComputing: false,
  knapsackResult: null,
  lastComputeError: null,

  setFiles: (files) => {
    set({ files: markDuplicates(files) });
    get().triggerRecompute();
  },

  addFiles: (newFiles) => {
    set((state) => {
      const combined = [...state.files, ...newFiles];
      return { files: markDuplicates(combined) };
    });
    get().triggerRecompute();
  },

  removeFile: (id) => {
    set((state) => {
      const next = state.files.filter((f) => f.id !== id);
      return { files: markDuplicates(next) };
    });
    get().triggerRecompute();
  },

  clearFiles: () => {
    set({ files: [], knapsackResult: null, manualKeptIds: [] });
  },

  togglePin: (id) => {
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, isPinned: !f.isPinned, isExcluded: f.isPinned ? f.isExcluded : false } : f
      ),
    }));
    get().triggerRecompute();
  },

  toggleExclude: (id) => {
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, isExcluded: !f.isExcluded, isPinned: f.isExcluded ? f.isPinned : false } : f
      ),
    }));
    get().triggerRecompute();
  },

  setFilePlacement: (id, placement) => {
    set((state) => ({
      files: state.files.map((f) => {
        if (f.id !== id) return f;
        if (placement === 'always_keep') {
          return { ...f, isPinned: true, isExcluded: false };
        } else if (placement === 'never_keep') {
          return { ...f, isPinned: false, isExcluded: true };
        } else {
          return { ...f, isPinned: false, isExcluded: false };
        }
      }),
    }));
    get().triggerRecompute();
  },

  setFileImportanceTier: (id, tier) => {
    // Important = 9, Normal = 5, Can go = 2
    const priority = tier === 'important' ? 9 : tier === 'normal' ? 5 : 2;
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, priority, prioritySource: 'edited' } : f
      ),
    }));
    get().triggerRecompute();
  },

  bulkSetPlacement: (ids, placement) => {
    const idSet = new Set(ids);
    set((state) => ({
      files: state.files.map((f) => {
        if (!idSet.has(f.id)) return f;
        if (placement === 'always_keep') {
          return { ...f, isPinned: true, isExcluded: false };
        } else if (placement === 'never_keep') {
          return { ...f, isPinned: false, isExcluded: true };
        } else {
          return { ...f, isPinned: false, isExcluded: false };
        }
      }),
    }));
    get().triggerRecompute();
  },

  bulkSetImportance: (ids, priority) => {
    const idSet = new Set(ids);
    set((state) => ({
      files: state.files.map((f) =>
        idSet.has(f.id) ? { ...f, priority, prioritySource: 'edited' } : f
      ),
    }));
    get().triggerRecompute();
  },

  updatePriority: (id, priority) => {
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, priority, prioritySource: 'edited' } : f
      ),
    }));
    get().triggerRecompute();
  },

  loadPreset: (type) => {
    let dataset = STUDENT_LAPTOP_DATASET;
    let defaultQuota = 15 * BYTE_UNITS.GB;
    let prof: ProfileId = 'student';

    if (type === 'photographer') {
      dataset = PHOTOGRAPHER_DATASET;
      defaultQuota = 64 * BYTE_UNITS.GB;
      prof = 'photos_first';
    } else if (type === 'company') {
      dataset = COMPANY_SERVER_DATASET;
      defaultQuota = 128 * BYTE_UNITS.GB;
      prof = 'work_first';
    }

    set({
      files: markDuplicates(dataset),
      quotaBytes: defaultQuota,
      profileId: prof,
      places: [{ id: 'p1', name: 'Primary Storage', quotaBytes: defaultQuota, color: 'var(--color-primary)' }],
      searchQuery: '',
      categoryFilter: 'all',
      manualKeptIds: [],
    });
    get().triggerRecompute();
  },

  deduplicateKeepOneAction: () => {
    set((state) => ({
      files: resolveDuplicatesKeepOne(state.files),
    }));
    get().triggerRecompute();
  },

  setFolderMode: (enabled) => {
    set({ folderMode: enabled });
    get().triggerRecompute();
  },

  setCapStrategy: (strategy) => {
    set({ capStrategy: strategy });
    get().triggerRecompute();
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setSort: (sortBy, order) => {
    set((state) => ({
      sortBy,
      sortOrder: order ?? (state.sortBy === sortBy ? (state.sortOrder === 'asc' ? 'desc' : 'asc') : 'desc'),
    }));
  },

  setQuotaBytes: (quotaBytes) => {
    set((state) => ({
      quotaBytes,
      places: state.places.map((p, idx) => idx === 0 ? { ...p, quotaBytes } : p),
    }));
    get().triggerRecompute();
  },

  setRoundingUnitOption: (quotaUnitOption) => {
    set({ quotaUnitOption });
    get().triggerRecompute();
  },

  setPriorityRules: (priorityRules) => {
    set({ priorityRules });
    get().recalculatePrioritiesAction();
  },

  setProfile: (profileId) => {
    set((state) => {
      const updatedFiles = applyProfileToFiles(state.files, profileId, state.profileToggles, false);
      return { profileId, files: updatedFiles };
    });
    get().triggerRecompute();
  },

  setProfileToggle: (key, value) => {
    set((state) => {
      const nextToggles = { ...state.profileToggles, [key]: value };
      const updatedFiles = applyProfileToFiles(state.files, state.profileId, nextToggles, false);
      return { profileToggles: nextToggles, files: updatedFiles };
    });
    get().triggerRecompute();
  },

  setPackingMode: (packingMode) => {
    set((state) => {
      // If switching to manual, default manualKeptIds to current keptItems or pinned items
      if (packingMode === 'manual' && state.manualKeptIds.length === 0 && state.knapsackResult) {
        return {
          packingMode,
          manualKeptIds: state.knapsackResult.keptItems.map((i) => i.id),
        };
      }
      return { packingMode };
    });
  },

  toggleManualKept: (id) => {
    set((state) => {
      const file = state.files.find((f) => f.id === id);
      if (file?.isPinned) {
        // Always-keep items cannot be removed
        return state;
      }
      const isAlreadyKept = state.manualKeptIds.includes(id);
      const next = isAlreadyKept
        ? state.manualKeptIds.filter((kId) => kId !== id)
        : [...state.manualKeptIds, id];
      return { manualKeptIds: next };
    });
  },

  saveCurrentAsPlanA: () => {
    const state = get();
    if (!state.knapsackResult) return;
    set({
      savedPlanA: {
        name: 'Plan A',
        quotaBytes: state.quotaBytes,
        keptIds: state.knapsackResult.keptItems.map((i) => i.id),
        totalValue: state.knapsackResult.totalValue,
        totalSize: state.knapsackResult.totalSizeKept,
        savedAt: Date.now(),
      },
    });
  },

  clearPlanA: () => set({ savedPlanA: null }),

  addPlace: (place) => {
    set((state) => ({ places: [...state.places, place] }));
  },

  removePlace: (id) => {
    set((state) => ({ places: state.places.filter((p) => p.id !== id) }));
  },

  updatePlace: (id, updates) => {
    set((state) => ({
      places: state.places.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  },

  recalculatePrioritiesAction: () => {
    set((state) => ({
      files: recalculateFilePriorities(state.files, state.priorityRules, false),
    }));
    get().triggerRecompute();
  },

  setIsScanning: (isScanning, scanProgress = null) => {
    set({ isScanning, scanProgress });
  },

  triggerRecompute: async () => {
    if (computeTimer) {
      clearTimeout(computeTimer);
    }

    computeTimer = setTimeout(async () => {
      const state = get();
      const { files, quotaBytes, quotaUnitOption, folderMode, capStrategy } = state;

      if (files.length === 0 || quotaBytes <= 0) {
        set({ knapsackResult: null, isComputing: false });
        return;
      }

      set({ isComputing: true, lastComputeError: null });

      const unitBytes = resolveUnitBytes(quotaBytes, quotaUnitOption);
      const quotaUnits = normaliseQuota(quotaBytes, unitBytes);

      let itemsToSolve: KnapsackItem[] = [];

      if (folderMode) {
        // Aggregate into folders
        const folders = aggregateFolders(files);
        itemsToSolve = folders.map((folder) => ({
          id: folder.id,
          name: `${folder.name} (${folder.fileCount} files)`,
          path: folder.path,
          originalSize: folder.size,
          normalizedSize: normaliseItemSize(folder.size, unitBytes),
          value: folder.priority,
          category: 'other',
          isPinned: folder.isPinned,
          isExcluded: folder.isExcluded,
        }));
      } else {
        // Use cap strategy if > 500 items
        const { items } = applyCapStrategy(files, capStrategy, unitBytes);
        itemsToSolve = items;
      }

      try {
        const result = await runFullKnapsackAsync(itemsToSolve, {
          quotaUnits,
          quotaBytes,
          unitBytes,
        });

        set({
          knapsackResult: result,
          isComputing: false,
          lastComputeError: result.error || null,
        });

        // Persist session to IndexedDB
        saveAutoSession({
          quotaBytes,
          quotaUnitOption,
          folderMode,
          filesCount: files.length,
          savedAt: Date.now(),
        });
      } catch (err: any) {
        console.error('Computation failed:', err);
        set({
          isComputing: false,
          lastComputeError: err.message || 'Unknown algorithm error',
        });
      }
    }, 120); // 120ms debounce
  },
}));

