import type { IStateHistoryManager } from '../../domain/ports/IStateHistoryManager';

interface HistoryEntry<T> {
  state: T;
  actionName?: string;
  timestamp: number;
}

/**
 * Secondary Adapter: Manages in-memory state history for undo/rollback operations
 */
export class InMemoryStateHistoryAdapter<T> implements IStateHistoryManager<T> {
  private undoStack: HistoryEntry<T>[] = [];
  private redoStack: HistoryEntry<T>[] = [];
  private maxDepth: number;

  constructor(maxDepth: number = 30) {
    this.maxDepth = maxDepth;
  }

  pushSnapshot(state: T, actionName?: string): void {
    this.undoStack.push({
      state: JSON.parse(JSON.stringify(state)),
      actionName,
      timestamp: Date.now(),
    });

    if (this.undoStack.length > this.maxDepth) {
      this.undoStack.shift();
    }

    // Clearing redo stack on new mutations is standard Memento behavior
    this.redoStack = [];
  }

  undo(): { state: T; actionName?: string } | null {
    if (this.undoStack.length === 0) return null;

    const entry = this.undoStack.pop();
    if (!entry) return null;

    return {
      state: JSON.parse(JSON.stringify(entry.state)),
      actionName: entry.actionName,
    };
  }

  redo(): { state: T; actionName?: string } | null {
    if (this.redoStack.length === 0) return null;

    const entry = this.redoStack.pop();
    if (!entry) return null;

    return {
      state: JSON.parse(JSON.stringify(entry.state)),
      actionName: entry.actionName,
    };
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  getHistoryDepth(): number {
    return this.undoStack.length;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
