type AnthropicMessage = {
  system: string;
  prompt: string;
  fallback: string;
  maxTokens?: number;
  storageKey?: string;
};

export async function gerarTextoAnthropic({
  system,
  prompt,
  fallback,
  maxTokens = 180,
  storageKey,
}: AnthropicMessage): Promise<string> {
  if (typeof window !== "undefined" && storageKey) {
    const cached = sessionStorage.getItem(storageKey);
    if (cached) return cached;
  }

  const key =
    (import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined) ??
    (import.meta.env.ANTHROPIC_API_KEY as string | undefined);

  if (!key) return fallback;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) throw new Error("Falha ao chamar o Pulse Coach.");
    const json = await response.json();
    const text =
      json.content?.find((item: { type?: string; text?: string }) => item.type === "text")?.text ??
      fallback;
    const clean = String(text).trim();
    if (typeof window !== "undefined" && storageKey) sessionStorage.setItem(storageKey, clean);
    return clean;
  } catch {
    return fallback;
  }
}
