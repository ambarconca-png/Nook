"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Die App bleibt auch ohne Offline-Unterstützung vollständig nutzbar.
      });
    }
  }, []);

  return null;
}
