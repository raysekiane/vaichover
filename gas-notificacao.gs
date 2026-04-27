// ─────────────────────────────────────────────────────────────
//  Vaichover — Notificação push via ntfy.sh
//  Substitui o alerta por email por notificação no celular.
//
//  Setup:
//  1. Crie um tópico único em ntfy.sh (ex: "vaichover-suacasa")
//  2. Instale o app ntfy no celular e assine o tópico
//  3. Configure o trigger deste script para rodar às 7h todo dia
// ─────────────────────────────────────────────────────────────

const API_KEY_WEATHER = "2ead9b7ef16d778eeb8a35007e055f92";
const CIDADE          = "Florianopolis,BR";
const NTFY_TOPICO     = "vaichover-suacasa"; // ← mude para um nome único seu

function enviarAlertaJanelas() {
  try {
    const res  = UrlFetchApp.fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${CIDADE}&appid=${API_KEY_WEATHER}&units=metric&lang=pt_br`
    );
    const data = JSON.parse(res.getContentText());

    const kmh  = Math.round(data.wind.speed * 3.6);
    const deg  = data.wind.deg ?? 0;
    const rain = data.weather.some(w => ["Rain", "Drizzle", "Thunderstorm"].includes(w.main));

    const dirs    = ["Norte","Nordeste","Leste","Sudeste","Sul","Sudoeste","Oeste","Noroeste"];
    const dirText = dirs[Math.round(deg / 45) % 8];

    const danger = rain || kmh > 15;
    if (!danger) return; // sem perigo → sem notificação

    const janelas = [
      { nome: "Sala",            dMin:  60, dMax: 200 },
      { nome: "Escrit. Pati",    dMin:  60, dMax: 200 },
      { nome: "Quarto",          dMin:  60, dMax: 200 },
      { nome: "Escrit. Ra",      dMin:  60, dMax: 200 },
      { nome: "Área de Serviço", dMin: 160, dMax: 270 },
    ];

    const fechar = janelas.filter(j => deg > j.dMin && deg < j.dMax).map(j => j.nome);
    if (fechar.length === 0) return; // vento forte mas não afeta nenhuma janela

    const motivo = rain ? "Chuva prevista" : `Vento ${dirText} ${kmh} km/h`;

    UrlFetchApp.fetch(`https://ntfy.sh/${NTFY_TOPICO}`, {
      method:  "post",
      headers: {
        "Title":    "⚠️ Fechar janelas antes de sair!",
        "Priority": "high",
        "Tags":     "house,wind",
      },
      payload: `${motivo}\nFechar: ${fechar.join(", ")}`,
    });

  } catch (e) {
    console.log("Erro: " + e);
  }
}
