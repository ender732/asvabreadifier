import { createHash } from "node:crypto";
import { getStore } from "@netlify/blobs";

type ProgressBody = {
  safeWord?: string;
  progress?: unknown;
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    },
  });
}

function normalizeSafeWord(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function keyForSafeWord(safeWord: string): string {
  return createHash("sha256").update(safeWord).digest("hex");
}

function isValidSafeWord(value: string): boolean {
  return value.length >= 4 && value.length <= 64;
}

async function handler(request: Request) {
  if (request.method === "OPTIONS") {
    return json(204, {});
  }

  const store = getStore("asvab-progress");

  if (request.method === "GET") {
    const url = new URL(request.url);
    const safeWord = normalizeSafeWord(url.searchParams.get("safeWord") ?? "");
    if (!isValidSafeWord(safeWord)) {
      return json(400, { error: "Enter a safe word with at least 4 characters." });
    }

    const raw = await store.get(keyForSafeWord(safeWord), { type: "text" });
    if (!raw) {
      return json(404, { error: "No saved progress found for that safe word." });
    }

    try {
      return json(200, { progress: JSON.parse(raw) });
    } catch {
      return json(500, { error: "Saved progress is corrupted." });
    }
  }

  if (request.method === "POST") {
    let body: ProgressBody;
    try {
      body = (await request.json()) as ProgressBody;
    } catch {
      return json(400, { error: "Invalid JSON body." });
    }

    const safeWord = normalizeSafeWord(body.safeWord ?? "");
    if (!isValidSafeWord(safeWord)) {
      return json(400, { error: "Enter a safe word with at least 4 characters." });
    }

    if (!body.progress || typeof body.progress !== "object") {
      return json(400, { error: "Missing progress payload." });
    }

    const progress = {
      ...(body.progress as Record<string, unknown>),
      version: 1,
      updatedAt: new Date().toISOString(),
    };

    await store.set(keyForSafeWord(safeWord), JSON.stringify(progress));
    return json(200, { ok: true, updatedAt: progress.updatedAt });
  }

  return json(405, { error: "Method not allowed." });
}

export default handler;
