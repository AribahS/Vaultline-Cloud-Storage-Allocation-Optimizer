/**
 * Flow store: manages the scene-by-scene progression for the new UI.
 * Separate from the engine-focused useAppStore.
 */
import { create } from 'zustand';

export type SceneId = 'drop' | 'room' | 'swipe' | 'pack' | 'result';
export type SwipeVerdict = 'important' | 'can_go' | 'must_keep' | 'normal';

export interface SwipeDecision {
  fileId: string;
  verdict: SwipeVerdict;
}

export interface FlowState {
  // Current scene
  currentScene: SceneId;
  setScene: (scene: SceneId) => void;

  // Can navigate to a scene
  canNavigate: (scene: SceneId) => boolean;

  // Teacher mode
  teacherMode: boolean;
  toggleTeacherMode: () => void;

  // Boxy tips
  showTips: boolean;
  setShowTips: (show: boolean) => void;

  // Room settings
  selectedTarget: string | null;
  customSizeBytes: number;
  setSelectedTarget: (target: string | null) => void;
  setCustomSizeBytes: (bytes: number) => void;

  // Swipe decisions
  swipeDecisions: SwipeDecision[];
  addSwipeDecision: (decision: SwipeDecision) => void;
  clearSwipeDecisions: () => void;

  // Pack animation
  packAnimationDone: boolean;
  setPackAnimationDone: (done: boolean) => void;

  // Track completion
  filesDropped: boolean;
  roomPicked: boolean;
  swipeDone: boolean;
  setFilesDropped: (v: boolean) => void;
  setRoomPicked: (v: boolean) => void;
  setSwipeDone: (v: boolean) => void;

  // Start over
  startOver: () => void;
}

const sceneOrder: SceneId[] = ['drop', 'room', 'swipe', 'pack', 'result'];

export const useFlowStore = create<FlowState>((set, get) => ({
  currentScene: 'drop',
  setScene: (scene) => set({ currentScene: scene }),

  canNavigate: (scene) => {
    const state = get();
    const idx = sceneOrder.indexOf(scene);
    if (idx === 0) return true;
    if (idx === 1) return state.filesDropped;
    if (idx === 2) return state.filesDropped && state.roomPicked;
    if (idx === 3) return state.filesDropped && state.roomPicked && state.swipeDone;
    if (idx === 4) return state.filesDropped && state.roomPicked && state.swipeDone && state.packAnimationDone;
    return false;
  },

  teacherMode: false,
  toggleTeacherMode: () => set((s) => ({ teacherMode: !s.teacherMode })),

  showTips: true,
  setShowTips: (showTips) => set({ showTips }),

  selectedTarget: null,
  customSizeBytes: 0,
  setSelectedTarget: (target) => set({ selectedTarget: target }),
  setCustomSizeBytes: (bytes) => set({ customSizeBytes: bytes }),

  swipeDecisions: [],
  addSwipeDecision: (decision) =>
    set((s) => ({
      swipeDecisions: [...s.swipeDecisions.filter((d) => d.fileId !== decision.fileId), decision],
    })),
  clearSwipeDecisions: () => set({ swipeDecisions: [] }),

  packAnimationDone: false,
  setPackAnimationDone: (done) => set({ packAnimationDone: done }),

  filesDropped: false,
  roomPicked: false,
  swipeDone: false,
  setFilesDropped: (v) => set({ filesDropped: v }),
  setRoomPicked: (v) => set({ roomPicked: v }),
  setSwipeDone: (v) => set({ swipeDone: v }),

  startOver: () =>
    set({
      currentScene: 'drop',
      selectedTarget: null,
      customSizeBytes: 0,
      swipeDecisions: [],
      packAnimationDone: false,
      filesDropped: false,
      roomPicked: false,
      swipeDone: false,
    }),
}));
