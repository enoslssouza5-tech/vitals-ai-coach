import { createServerFn } from "@tanstack/react-start";

interface CoachInput {
  modalidade: string;
  duracaoSeg: number;
  distanciaMetros: number;
  caloriasKcal: number;
  ritmoMedio?: string | null;
  fcMedia?: number | null;
}

export const gerarAnaliseCoach = createServerFn({ method: "POST" })
  .inputValidator((data: CoachInput) => data)
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return {
        analise:
          "Excelente sessão! Mantenha a consistência. Ponto de melhoria: aquecimento mais longo. Elogio: você completou o treino — esse é o passo que conta.",
        fallback: true,
      };
    }

    const min = Math.floor(data.duracaoSeg / 60);
    const km = (data.distanciaMetros / 1000).toFixed(2);

    const userContext = `Modalidade: ${data.modalidade}
Duração: ${min} minutos
Distância: ${km} km
Calorias: ${data.caloriasKcal} kcal
Ritmo médio: ${data.ritmoMedio ?? "n/a"}
FC média: ${data.fcMedia ?? "n/a"} bpm`;

    try {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                "Você é um coach esportivo de elite. Com base nos dados do treino, dê uma análise curta (3-4 linhas), motivacional e técnica. Inclua: avaliação do desempenho, 1 ponto de melhoria e 1 elogio. Responda SEMPRE em português brasileiro, sem listas, em parágrafo fluido.",
            },
            { role: "user", content: userContext },
          ],
        }),
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        console.error("[coach] gateway error", resp.status, txt);
        if (resp.status === 429)
          return { analise: "Limite de uso da IA atingido. Tente em alguns instantes.", fallback: true };
        if (resp.status === 402)
          return { analise: "Créditos de IA esgotados. Adicione créditos para análises personalizadas.", fallback: true };
        return { analise: "Não consegui gerar a análise agora. Bom treino!", fallback: true };
      }

      const json = await resp.json();
      const analise: string =
        json?.choices?.[0]?.message?.content?.trim() ||
        "Treino concluído com sucesso. Continue assim!";
      return { analise, fallback: false };
    } catch (e) {
      console.error("[coach] error", e);
      return { analise: "Treino concluído. Mantenha o ritmo nas próximas sessões!", fallback: true };
    }
  });
