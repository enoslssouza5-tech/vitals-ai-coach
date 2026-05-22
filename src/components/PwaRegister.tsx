import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") return;

    navigator.serviceWorker.register("/service-worker.js").catch(() => {
      // Registration is best-effort; the app must remain fully usable without it.
    });
  }, []);

  return null;
}
