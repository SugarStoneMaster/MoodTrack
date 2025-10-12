import type { Entry } from '../api/types';

type Listener = (e: Entry | null) => void;
const listeners = new Set<Listener>();

export function onEntryCreated(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function notifyEntryCreated(entry: Entry | null) {
  listeners.forEach(fn => fn(entry));
}