import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Chat de atendimento (Chatwoot da HolyNex). O token abaixo é público: identifica a caixa do site.
const BASE_URL = "https://www.atendimento.holynexlabs.com.br";
const WEBSITE_TOKEN = "EgPmRotSPLTMQ7dGwr8MVKzh";

type Chatwoot = {
  toggle: (estado?: "open" | "close") => void;
  toggleBubbleVisibility: (visivel: "show" | "hide") => void;
};

declare global {
  interface Window {
    chatwootSettings?: Record<string, unknown>;
    chatwootSDK?: { run: (opcoes: { websiteToken: string; baseUrl: string }) => void };
    $chatwoot?: Chatwoot;
  }
}

// Área administrativa e propostas enviadas a clientes não mostram o chat.
const esconderEm = (caminho: string) => caminho.startsWith("/admin") || caminho.startsWith("/proposta/");

function aplicar(caminho: string) {
  const chat = window.$chatwoot;
  if (!chat) return;
  if (esconderEm(caminho)) {
    chat.toggle("close");
    chat.toggleBubbleVisibility("hide");
  } else {
    chat.toggleBubbleVisibility("show");
  }
}

export default function ChatAtendimento() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (window.$chatwoot) {
      aplicar(pathname);
      return;
    }
    if (esconderEm(pathname) || document.getElementById("chatwoot-sdk")) return;

    window.chatwootSettings = { position: "left", locale: "pt_BR", type: "standard", launcherTitle: "Fale com a gente" };
    // Se a pessoa mudou de página enquanto o chat carregava, respeita a página atual.
    window.addEventListener("chatwoot:ready", () => aplicar(window.location.pathname), { once: true });
    const script = document.createElement("script");
    script.id = "chatwoot-sdk";
    script.src = `${BASE_URL}/packs/js/sdk.js`;
    script.async = true;
    script.onload = () => window.chatwootSDK?.run({ websiteToken: WEBSITE_TOKEN, baseUrl: BASE_URL });
    document.body.appendChild(script);
  }, [pathname]);

  return null;
}
