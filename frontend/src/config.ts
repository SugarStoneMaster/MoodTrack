// src/config.ts
import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * Ordine di risoluzione:
 * 1) EXPO manifest extra (impostato da app.config.js quando usi `npm run start:dev|prod`)
 * 2) process.env.EXPO_PUBLIC_API_BASE (fallback, se qualche tool lo popola)
 * 3) valore LOCAL_IP per sviluppo sulla LAN (tuo pc)
 * 4) DEFAULT emulator fallback
 */

const LOCAL_IP = "http://192.168.1.10:8080"; // tieni questo come valore di sviluppo locale

const DEFAULT_BASE =
  Platform.OS === "android" ? "http://10.0.2.2:8080" : "http://127.0.0.1:8080";

function fromManifestExtra(): string | undefined {
  try {
    // Constants.manifest può essere undefined in alcuni runtime, ma Constants.manifest?.extra è la source più usata
    const manifest: any = Constants.manifest || (Constants as any).expoConfig || {};
    if (manifest && manifest.extra && manifest.extra.EXPO_PUBLIC_API_BASE) {
      return String(manifest.extra.EXPO_PUBLIC_API_BASE).trim();
    }
  } catch {
    // ignored
  }
  return undefined;
}

const MANIFEST_BASE = fromManifestExtra();
const ENV_BASE = (process.env.EXPO_PUBLIC_API_BASE ?? "").trim();

export const API_BASE = MANIFEST_BASE || ENV_BASE || LOCAL_IP || DEFAULT_BASE;