import type { Config } from "@netlify/functions";

// TradeDesk — Groq AI Proxy
// 3-tier routing:
//   1. body.userKey present & valid → use user's own Groq key (unlimited)
//   2. no userKey → use platform GROQ_API_KEY env var (free for all users)
//   3. neither → 503
//
// userKey is used for this single request only — never stored anywhere.
// GROQ_API_KEY lives only in Netlify env vars, never in browser code.

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { userKey, model, messages, max_tokens, ...rest } = body as {
    userKey?: string;
    model?: string;
    messages?: unknown[];
    max_tokens?: number;
    [key: string]: unknown;
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages array is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Pick key: valid userKey takes priority over platform key
  const isValidUserKey =
    typeof userKey === "string" &&
    userKey.startsWith("gsk_") &&
    userKey.length > 20;

  const apiKey = isValidUserKey
    ? userKey
    : Netlify.env.get("GROQ_API_KEY");

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          "AI not configured. Add GROQ_API_KEY in Netlify → Site configuration → Environment variables, then redeploy.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  // Build Groq payload — never forward userKey to Groq
  const payload = {
    model: model || "llama-3.3-70b-versatile",
    max_tokens: Math.min(Number(max_tokens) || 900, 2000),
    messages,
    temperature: 0.7,
    ...rest,
  };

  let groqRes: Response;
  try {
    groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to reach Groq: " + (err as Error).message }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  const data = await groqRes.json();

  if (!groqRes.ok) {
    const msg = (data as { error?: { message?: string } })?.error?.message ?? "Groq error " + groqRes.status;

    // Rate limit on platform key → invite user to add their own key
    if (groqRes.status === 429 && !isValidUserKey) {
      return new Response(
        JSON.stringify({
          error:
            "Platform AI rate limit reached. Add your own Groq key in Settings → Your Groq API Key for unlimited usage.",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: msg }), {
      status: groqRes.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const config: Config = {
  path: "/api/ai-proxy",
};
