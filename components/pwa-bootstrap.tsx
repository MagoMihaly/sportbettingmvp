"use client";

import { useEffect } from "react";

export function PwaBootstrap() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // Silent bootstrap. Push UI reports actionable errors separately.
    });
  }, []);

  return null;
}
