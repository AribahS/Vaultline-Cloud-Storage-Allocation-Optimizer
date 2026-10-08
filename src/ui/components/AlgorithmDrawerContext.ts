import { createContext, useContext } from 'react';

export const AlgorithmDrawerContext = createContext<() => void>(() => undefined);

export function useOpenAlgorithmDrawer(): () => void {
  return useContext(AlgorithmDrawerContext);
}
