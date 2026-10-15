globalThis.localStorage = { getItem: () => null, setItem: () => null, removeItem: () => null } as any;
globalThis.sessionStorage = { getItem: () => null, setItem: () => null, removeItem: () => null } as any;
import { useAppStore } from './src/store/useAppStore';
console.log(useAppStore.getState().files.map(f => f.id + ' ' + f.name + ' ' + f.size));
