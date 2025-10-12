// Semplice cache in-memory per dati prefetcha ti post-login
import type { Entry, UserProfile } from '../api/types';

let _entries: Entry[] | null = null;
let _profile: UserProfile | null = null;

export function primeEntries(list: Entry[] | null) {
  _entries = list;
}
export function getCachedEntries(): Entry[] | null {
  return _entries;
}

export function primeProfile(p: UserProfile | null) {
  _profile = p;
}
export function getCachedProfile(): UserProfile | null {
  return _profile;
}

export function clearAllCache() {
  _entries = null;
  _profile = null;
}