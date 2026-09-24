/**
 * Secondary (Driven) Port: Memento / State History Manager
 * Enables reverting to previous states ("balik ke state sebelumnya")
 */
export interface IStateHistoryManager<T> {
  pushSnapshot(state: T, actionName?: string): void;
  undo(): { state: T; actionName?: string } | null;
  redo(): { state: T; actionName?: string } | null;
  canUndo(): boolean;
  canRedo(): boolean;
  getHistoryDepth(): number;
  clear(): void;
}
