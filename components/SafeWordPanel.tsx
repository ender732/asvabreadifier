"use client";

import { useState } from "react";
import {
  clearStoredSafeWord,
  createEmptyProgress,
  generateSafeWord,
  isValidSafeWord,
  loadProgressFromCloud,
  normalizeSafeWord,
  readLocalProgress,
  readStoredSafeWord,
  saveProgressToCloud,
  writeLocalProgress,
  writeStoredSafeWord,
} from "@/lib/progress";

type SafeWordPanelProps = {
  onRestored?: () => void;
};

export default function SafeWordPanel({ onRestored }: SafeWordPanelProps) {
  const [mode, setMode] = useState<"idle" | "save" | "restore">("idle");
  const [safeWord, setSafeWord] = useState(() => readStoredSafeWord() ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const remembered = Boolean(readStoredSafeWord());

  async function handleSave() {
    setError(null);
    setStatus(null);

    const word = normalizeSafeWord(safeWord || generateSafeWord());
    if (!isValidSafeWord(word)) {
      setError("Use at least 4 letters or numbers for your safe word.");
      return;
    }

    setBusy(true);
    try {
      const progress = readLocalProgress() ?? createEmptyProgress();
      await saveProgressToCloud(word, progress);
      writeStoredSafeWord(word);
      setSafeWord(word);
      setStatus(`Saved. Your safe word is “${word}”. Write it down — it’s your only key.`);
      setMode("idle");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Cloud save failed. Local progress is still on this device.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore() {
    setError(null);
    setStatus(null);

    const word = normalizeSafeWord(safeWord);
    if (!isValidSafeWord(word)) {
      setError("Enter the safe word you used when saving.");
      return;
    }

    setBusy(true);
    try {
      const progress = await loadProgressFromCloud(word);
      writeLocalProgress(progress);
      writeStoredSafeWord(word);
      setStatus("Progress restored on this device.");
      setMode("idle");
      onRestored?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not restore progress.");
    } finally {
      setBusy(false);
    }
  }

  function inventSafeWord() {
    const word = generateSafeWord();
    setSafeWord(word);
    setError(null);
    setStatus(null);
    setMode("save");
  }

  function forgetSafeWord() {
    clearStoredSafeWord();
    setSafeWord("");
    setStatus("Forgot this device’s remembered safe word. Cloud data is unchanged.");
  }

  return (
    <section className="rounded-[2rem] border border-[#dedbd1] bg-white p-6 shadow-[0_16px_45px_rgba(49,62,54,0.06)] sm:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8b6b3d]">
            Progress backup
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#183229]">
            Safe word account
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667069]">
            No email. Pick or invent a safe word, save your scores under it, then
            type that same word on any device to pull your progress back.
          </p>
        </div>
        {remembered && (
          <button
            type="button"
            onClick={forgetSafeWord}
            className="text-xs font-semibold text-[#8a6d5a] underline-offset-2 hover:underline"
          >
            Forget remembered word
          </button>
        )}
      </div>

      {mode === "idle" && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              setMode("save");
              setError(null);
              setStatus(null);
              if (!safeWord) inventSafeWord();
            }}
            className="rounded-2xl bg-[#183229] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#284a3e]"
          >
            Save with safe word
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("restore");
              setError(null);
              setStatus(null);
            }}
            className="rounded-2xl border border-[#d6d2c8] bg-[#fcfbf7] px-5 py-3.5 text-sm font-bold text-[#183229] transition hover:bg-white"
          >
            Restore with safe word
          </button>
          <button
            type="button"
            onClick={inventSafeWord}
            className="rounded-2xl border border-transparent px-5 py-3.5 text-sm font-semibold text-[#657069] transition hover:text-[#183229]"
          >
            Invent a new word
          </button>
        </div>
      )}

      {(mode === "save" || mode === "restore") && (
        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#68736d]">
              Safe word
            </span>
            <input
              value={safeWord}
              onChange={(event) => setSafeWord(event.target.value)}
              placeholder="coral-tide-lantern"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className="mt-2 w-full rounded-2xl border border-[#d8d5cc] bg-[#fcfbf8] px-4 py-3.5 font-mono text-base text-[#183229] outline-none ring-[#315c4b] focus:ring-2"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={busy}
              onClick={mode === "save" ? handleSave : handleRestore}
              className="rounded-2xl bg-[#183229] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#284a3e] disabled:opacity-60"
            >
              {busy
                ? mode === "save"
                  ? "Saving…"
                  : "Restoring…"
                : mode === "save"
                  ? "Save progress now"
                  : "Restore progress"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setMode("idle");
                setError(null);
              }}
              className="rounded-2xl border border-[#d6d2c8] px-5 py-3.5 text-sm font-semibold text-[#657069]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {status && (
        <p className="mt-5 rounded-2xl border border-[#c5ded2] bg-[#f0f7f3] px-4 py-3 text-sm leading-6 text-[#315c4b]">
          {status}
        </p>
      )}
      {error && (
        <p className="mt-5 rounded-2xl border border-[#e3c4bd] bg-[#fff6f3] px-4 py-3 text-sm leading-6 text-[#8a4d42]">
          {error}
        </p>
      )}
    </section>
  );
}
