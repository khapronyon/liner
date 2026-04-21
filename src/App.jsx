import { useState } from "react";

const PERCORSI = ["Brano", "Album", "Vinile", "Concerto", "Artista"];

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const PROMPT_BASE = `Sei un critico musicale che scrive per una rivista culturale seria. Il tuo tono è quello di un pezzo lungo di Rolling Stone o del Post italiano: autorevole, diretto, con un punto di vista netto. Non sei neutro — hai opinioni e le difendi. Usi l'ironia solo quando è davvero efficace, mai per riempire. Non usi mai frasi fatte, superlativi gratuiti o aggettivi vuoti come "magistrale", "capolavoro", "intramontabile". Non elenchi pregi in modo meccanico. Scrivi come un essere umano che conosce profondamente la musica e si annoia delle recensioni prevedibili. Per ogni asse scrivi un paragrafo di 3-4 righe in prosa sciolta, senza elenchi puntati, senza grassetto, senza titoli numerati. Separa ogni asse con il nome dell'asse su una riga da sola, senza numeri e senza grassetto. Il nome dell'asse deve corrispondere esattamente a uno di quelli elencati sotto.`;

const ASSI_CONFIG = {
  Brano: {
    assi: ["Contesto storico", "Suono e produzione", "Influenze", "Eredità culturale", "Perché ascoltarlo oggi"],
    prompt: (input) => `Analizza il brano "${input}" su questi 5 assi:
— Contesto storico: dove si colloca questo brano e perché quel momento contava
— Suono e produzione: cosa succede tecnicamente e cosa significa esteticamente
— Influenze: da dove viene, cosa ha assorbito e rielaborato
— Eredità culturale: cosa ha lasciato, chi ha cambiato idea dopo averlo sentito
— Perché ascoltarlo oggi: non la risposta ovvia`,
  },
  Album: {
    assi: ["Contesto storico", "Suono e produzione", "Struttura e sequenza", "Eredità culturale", "Perché ascoltarlo oggi"],
    prompt: (input) => `Analizza l'album "${input}" su questi 5 assi:
— Contesto storico: dove si colloca questo album e perché quel momento contava
— Suono e produzione: cosa succede tecnicamente e cosa significa esteticamente
— Struttura e sequenza: la logica interna dell'album, come i brani si parlano tra loro, cosa succede dall'apertura alla chiusura
— Eredità culturale: cosa ha lasciato, chi ha cambiato idea dopo averlo sentito
— Perché ascoltarlo oggi: non la risposta ovvia`,
  },
  Vinile: {
    assi: ["Contesto storico", "Suono e produzione", "Struttura lato A / lato B", "Collezionabilità", "Perché cercarlo oggi"],
    prompt: (input) => `Analizza il vinile "${input}" su questi 5 assi:
— Contesto storico: dove si colloca questa pubblicazione e perché quel momento contava
— Suono e produzione: con attenzione specifica al formato fisico, al mastering per vinile, a cosa cambia rispetto al digitale
— Struttura lato A / lato B: la divisione fisica come scelta editoriale e narrativa
— Collezionabilità: edizioni, pressioni, rarità, artwork
— Perché cercarlo oggi: cosa significa possedere questo disco in formato fisico`,
  },
  Concerto: {
    assi: ["Contesto storico", "Setlist e struttura", "Suono e performance", "Pubblico e luogo", "Perché vederlo oggi"],
    prompt: (input) => `Analizza il concerto "${input}" su questi 5 assi:
— Contesto storico: in che momento della carriera dell'artista si colloca, cosa stava succedendo intorno
— Setlist e struttura: come è costruita la scaletta, i momenti chiave, il ritmo della serata
— Suono e performance: come suonava dal vivo, differenze rispetto agli album, episodi significativi
— Pubblico e luogo: il rapporto con la venue, con il pubblico, l'atmosfera
— Perché vederlo oggi: per i concerti registrati, o perché vale la pena cercarne i bootleg`,
  },
  Artista: {
    assi: ["Traiettoria", "Suono e identità", "Influenze", "Eredità e impatto", "Da dove iniziare"],
    prompt: (input) => `Analizza l'artista "${input}" su questi 5 assi:
— Traiettoria: come si è evoluto nel tempo, i momenti di svolta, le fasi della carriera
— Suono e identità: cosa lo rende riconoscibile, qual è la sua firma sonora
— Influenze: da dove viene, cosa ha assorbito e rielaborato
— Eredità e impatto: chi ha influenzato, cosa ha cambiato nel panorama musicale
— Da dove iniziare: il punto di ingresso consigliato per chi non lo conosce, non necessariamente il disco più famoso`,
  },
};

const COLORI_PER_ASSE = [
  "#1B3A6B",
  "#2D6A4F",
  "#7B2D3E",
  "#8B4A00",
  "#3D2B6B",
];

function parseOutput(testo, assi) {
  const sezioni = [];

  for (let i = 0; i < assi.length; i++) {
    const asse = assi[i];
    const prossimoAsse = assi[i + 1];
    const inizioAsse = testo.indexOf(asse);
    if (inizioAsse === -1) continue;

    const dopoAsse = testo.indexOf("\n", inizioAsse) + 1;
    let fineContenuto = testo.length;

    if (prossimoAsse) {
      const inizioProssimo = testo.indexOf(prossimoAsse, dopoAsse);
      if (inizioProssimo !== -1) fineContenuto = inizioProssimo;
    }

    sezioni.push({
      asse,
      contenuto: testo.slice(dopoAsse, fineContenuto).trim(),
      colore: COLORI_PER_ASSE[i],
    });
  }

  return sezioni;
}

async function chiamaGeminiConRetry(percorso, input, onChunk, maxTentativi = 3) {
  const config = ASSI_CONFIG[percorso];
  const prompt = `${PROMPT_BASE}\n\n${config.prompt(input)}`;

  for (let tentativo = 1; tentativo <= maxTentativi; tentativo++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        const status = errorData?.error?.status;
        if (status === "UNAVAILABLE" && tentativo < maxTentativi) {
          await new Promise((r) => setTimeout(r, 2000 * tentativo));
          continue;
        }
        throw new Error(JSON.stringify(errorData));
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) onChunk(text);
            } catch {
              // riga incompleta, ignora
            }
          }
        }
      }
      return;

    } catch (e) {
      if (tentativo === maxTentativi) throw e;
      await new Promise((r) => setTimeout(r, 2000 * tentativo));
    }
  }
}

export default function App() {
  const [percorso, setPercorso] = useState("Brano");
  const [input, setInput] = useState("");
  const [outputRaw, setOutputRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState("");
  const [titoloRicerca, setTitoloRicerca] = useState("");
  const [completato, setCompletato] = useState(false);
  const [tentativoCorrente, setTentativoCorrente] = useState(0);

  const assiCorrente = ASSI_CONFIG[percorso].assi;
  const sezioni = completato ? parseOutput(outputRaw, assiCorrente) : [];

  function handlePercorso(p) {
    setPercorso(p);
    setOutputRaw("");
    setCompletato(false);
    setTitoloRicerca("");
    setErrore("");
    setInput("");
  }

  async function handleEsplora() {
    if (!input.trim()) return;
    setLoading(true);
    setOutputRaw("");
    setErrore("");
    setTitoloRicerca(input);
    setCompletato(false);
    setTentativoCorrente(1);

    let testo = "";
    try {
      await chiamaGeminiConRetry(
        percorso,
        input,
        (chunk) => {
          testo += chunk;
          setOutputRaw(testo);
        },
        3
      );
      setCompletato(true);
    } catch (e) {
      console.error(e);
      const msg = e.message.includes("UNAVAILABLE")
        ? "Gemini è sovraccarico in questo momento. Riprova tra qualche secondo."
        : "Qualcosa è andato storto. Riprova.";
      setErrore(msg);
    } finally {
      setLoading(false);
      setTentativoCorrente(0);
    }
  }

  return (
    <div style={{ fontFamily: "Georgia, serif", minHeight: "100vh", backgroundColor: "#F5F2EE", padding: "48px 24px", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center", marginBottom: "48px", width: "100%" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: "bold", letterSpacing: "-1px", marginBottom: "8px" }}>Liner</h1>
        <p style={{ color: "#666", fontSize: "1rem" }}>Esplorazione musicale consapevole</p>
      </div>

      {/* Selettore percorso */}
      <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", justifyContent: "center", gap: "12px", marginBottom: "32px", flexWrap: "wrap", width: "100%" }}>
        {PERCORSI.map((p) => (
          <button
            key={p}
            onClick={() => handlePercorso(p)}
            style={{
              padding: "8px 20px",
              borderRadius: "999px",
              border: "2px solid #111",
              backgroundColor: percorso === p ? "#111" : "transparent",
              color: percorso === p ? "#fff" : "#111",
              fontFamily: "Georgia, serif",
              fontSize: "0.95rem",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Campo input + bottone */}
      <div style={{ maxWidth: "600px", margin: "0 auto", marginBottom: "48px", width: "100%" }}>
        <input
          type="text"
          placeholder={`Inserisci un ${percorso.toLowerCase()}...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleEsplora()}
          style={{
            width: "100%",
            padding: "14px 20px",
            fontSize: "1rem",
            fontFamily: "Georgia, serif",
            border: "2px solid #111",
            borderRadius: "8px",
            marginBottom: "12px",
            backgroundColor: "#fff",
            boxSizing: "border-box",
          }}
        />
        <div style={{ textAlign: "center" }}>
          <button
            onClick={handleEsplora}
            disabled={loading}
            style={{
              padding: "12px 40px",
              backgroundColor: "#111",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontFamily: "Georgia, serif",
              fontSize: "1rem",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {loading ? "Sto esplorando..." : "Esplora"}
          </button>
        </div>
      </div>

      {/* Errore */}
      {errore && (
        <div style={{ maxWidth: "900px", margin: "0 auto 24px", color: "#c00", textAlign: "center", width: "100%" }}>
          {errore}
        </div>
      )}

      {/* Streaming in corso */}
      {loading && outputRaw && (
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px", backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #ddd", whiteSpace: "pre-wrap", fontFamily: "Georgia, serif", lineHeight: "1.7", color: "#333", width: "100%" }}>
          {outputRaw}
        </div>
      )}

      {/* Output finale a box */}
      {completato && sezioni.length > 0 && (
        <div style={{ maxWidth: "900px", margin: "0 auto", width: "100%" }}>

          {/* Titolo ricerca */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <p style={{ fontSize: "0.85rem", color: "#888", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "6px" }}>{percorso}</p>
            <h2 style={{ fontSize: "2rem", fontWeight: "bold", color: "#111" }}>{titoloRicerca}</h2>
          </div>

          {/* Griglia 2-2-1 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {sezioni.slice(0, 4).map((s, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: s.colore,
                  borderRadius: "12px",
                  padding: "28px",
                  color: "#fff",
                  animation: `fadeInUp 0.4s ease ${i * 0.1}s both`,
                }}
              >
                <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "2px", opacity: 0.7, marginBottom: "12px" }}>{s.asse}</p>
                <p style={{ fontSize: "1rem", lineHeight: "1.75", margin: 0 }}>{s.contenuto}</p>
              </div>
            ))}
          </div>

          {/* Quinta box centrata */}
          {sezioni[4] && (
            <div style={{ marginTop: "16px" }}>
              <div
                style={{
                  backgroundColor: sezioni[4].colore,
                  borderRadius: "12px",
                  padding: "28px",
                  color: "#fff",
                  animation: "fadeInUp 0.4s ease 0.4s both",
                }}
              >
                <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "2px", opacity: 0.7, marginBottom: "12px" }}>{sezioni[4].asse}</p>
                <p style={{ fontSize: "1rem", lineHeight: "1.75", margin: 0 }}>{sezioni[4].contenuto}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ maxWidth: "900px", margin: "64px auto 0", width: "100%", textAlign: "center", borderTop: "1px solid #ddd", paddingTop: "24px" }}>
        <p style={{ fontSize: "0.8rem", color: "#999" }}>
          Le analisi di Liner sono generate con il supporto di Gemini, il modello AI di Google.
        </p>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}