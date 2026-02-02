// Clipboard helper used across the app.
// Uses Clipboard API when available; falls back to a textarea copy.

export async function copyText(text: string): Promise<void> {
  const value = String(text ?? "");

  // Clipboard API (secure contexts)
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(value);
      return;
    }
  } catch {
    // fall back
  }

  // Fallback (older browsers / blocked clipboard API)
  try {
    if (typeof document === "undefined") return;

    const ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.left = "0";
    ta.style.opacity = "0";

    document.body.appendChild(ta);
    ta.focus();
    ta.select();

    document.execCommand("copy");
    document.body.removeChild(ta);
  } catch {
    // ignore
  }
}
