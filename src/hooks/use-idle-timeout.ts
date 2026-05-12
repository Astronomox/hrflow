"use client";

import { useEffect, useRef, useCallback } from "react";
import { signOut, useSession } from "next-auth/react";

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];

export function useIdleTimeout() {
  const { status } = useSession();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      signOut({ callbackUrl: "/login" });
    }, IDLE_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    // Only run when user is authenticated
    if (status !== "authenticated") return;

    resetTimer();

    EVENTS.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [status, resetTimer]);
}
