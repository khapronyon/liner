import { useState } from "react";

const PERCORSI = ["Artista", "Album", "Brano", "Concerto", "Vinile"];
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// ─── PROMPT BASE ──────────────────────────────────────────────────────────────
const PROMPT_BASE = `Sei un critico musicale con trent'anni di esperienza in elettronica, post-punk, rock, alternative e jazz.
Scrivi come un saggista di settore: autorevolezza, precisione, punto di vista netto.
Non sei un'enciclopedia generica — ogni frase deve guadagnarsi il diritto di stare lì.

VINCOLI OBBLIGATORI — non sono suggerimenti, sono regole assolute:
- Cita SEMPRE nomi propri reali: artisti, produttori, ingegneri del suono, etichette, studi di registrazione, città.
- Cita SEMPRE almeno 3 brani specifici con titolo esatto tra tutti gli assi.
- Cita SEMPRE almeno 2 date o anni precisi per localizzare il soggetto nel tempo.
- Non usare MAI queste frasi senza supporto fattuale: "ha influenzato molti artisti", "è considerato un capolavoro", "è un disco fondamentale", "ha cambiato la musica per sempre". Se le usi, devi citare chi, cosa, quando, come.
- Ogni affermazione deve essere verificabile. Se non hai un fatto concreto, non scrivere la frase.
- Tono: saggistico, diretto, mai entusiasta o promozionale. Puoi essere critico.
- Lingua: italiano.
- Nessun grassetto, nessun elenco puntato, nessun titolo numerato. Solo prosa sciolta.`;

// ─── ASSI CONFIG ──────────────────────────────────────────────────────────────
const ASSI_CONFIG = {
  Brano: {
    assi: ["Genesi", "Anatomia sonora", "Posizione storica", "Testo e voce", "Perché ancora"],
    prompt: (input) => `${PROMPT_BASE}

Analizza il brano "${input}". Struttura l'output ESATTAMENTE così, usando questi titoli di sezione su una riga sola:

Cronologia essenziale
Formato lista, massimo 6 voci: anno — evento specifico. Solo i momenti che cambiano qualcosa.

Genesi
Come è nato questo brano. Cita anno, luogo, studio di registrazione, chi era presente, produttore. Almeno un dettaglio specifico e verificabile sulla sessione o sul periodo compositivo. (150-200 parole di prosa)

Anatomia sonora
Cosa si sente e perché conta. Struttura del brano, strumentazione, scelte di produzione distintive. Cita almeno 2 elementi tecnici specifici (accordatura, tempo, effetti usati, strumento insolito, tecnica di registrazione) e spiega il loro impatto sul risultato finale. (150-200 parole di prosa)

Posizione storica
Dove si colloca questo brano nella storia della musica. Cita almeno 2 artisti o movimenti che lo hanno preceduto e influenzato (con anni). Cita almeno 2 artisti o opere successive che ha influenzato (con anni e titoli specifici). (150-200 parole di prosa)

Testo e voce
Cosa dice il testo e come viene detto. Cita versi specifici tra virgolette. Analizza la performance vocale con riferimenti tecnici o espressivi precisi. Se il brano è strumentale, analizza la melodia principale come se fosse una voce. (100-150 parole di prosa)

Perché ancora
Perché questo brano conta oggi. Argomenta con riferimenti concreti: campionamenti documentati con artista e anno, cover significative, usi in film o serie con titolo, momenti culturali specifici. Nessun luogo comune. (100-150 parole di prosa)

Ascolto guidato
3 brani in ordine. Il brano in analisi è sempre il secondo. Formato per ogni voce — una riga ciascuna:
1. Titolo — Artista: istruzione specifica di ascolto
2. Titolo — Artista: cosa ascoltare in modo specifico
3. Titolo — Artista: dove porta

Frase definitiva
Una sola frase. Massimo 30 parole. Punto di vista critico netto. Non deve piacere a tutti — deve essere vera.`,
  },

  Artista: {
    assi: ["Traiettoria", "Suono e identità", "Influenze", "Eredità e impatto", "Da dove iniziare"],
    prompt: (input) => `${PROMPT_BASE}

Analizza l'artista "${input}". Struttura l'output ESATTAMENTE così, usando questi titoli di sezione su una riga sola:

Cronologia essenziale
Formato lista, massimo 6 voci: anno — evento specifico. Solo i momenti che cambiano qualcosa.

Traiettoria
Come si è evoluto nel tempo. Cita i momenti di svolta con anni precisi, i dischi che segnano ogni fase, i cambi di lineup o direzione artistica documentati. (150-200 parole di prosa)

Suono e identità
Cosa lo rende riconoscibile. Cita strumenti specifici, tecniche produttive, collaboratori ricorrenti (produttori, session musician), etichette discografiche che hanno definito il suono. (150-200 parole di prosa)

Influenze
Da dove viene. Cita almeno 3 artisti o movimenti con anni e dischi specifici che si sentono nel suono. Spiega il meccanismo dell'influenza — non basta nominarla. (150-200 parole di prosa)

Eredità e impatto
Chi ha influenzato. Cita almeno 3 artisti successivi con anni e opere specifiche. Spiega in cosa consiste l'influenza concretamente, non in modo generico. (150-200 parole di prosa)

Da dove iniziare
Il punto di ingresso consigliato per chi non lo conosce. Non necessariamente il disco più famoso — quello più rivelatore. Spiega perché questo e non un altro, con riferimenti a brani specifici. (100-150 parole di prosa)

Ascolto guidato
3 dischi in ordine consigliato. Formato per ogni voce — una riga ciascuna:
1. Titolo — Anno: istruzione specifica di ascolto
2. Titolo — Anno: istruzione specifica di ascolto
3. Titolo — Anno: dove porta

Frase definitiva
Una sola frase. Massimo 30 parole. Punto di vista critico netto. Non deve piacere a tutti — deve essere vera.`,
  },

  Album: {
    assi: ["Contesto storico", "Suono e produzione", "Struttura e sequenza", "Eredità culturale", "Perché ascoltarlo oggi"],
    prompt: (input) => `${PROMPT_BASE}

Analizza l'album "${input}". Struttura l'output ESATTAMENTE così, usando questi titoli di sezione su una riga sola:

Cronologia essenziale
Formato lista, massimo 6 voci: anno — evento specifico. Solo i momenti che cambiano qualcosa.

Contesto storico
Dove si colloca questo album e perché quel momento contava. Cita anno, etichetta, cosa stava succedendo musicalmente e culturalmente in quel periodo con riferimenti specifici. (150-200 parole di prosa)

Suono e produzione
Cosa succede tecnicamente e cosa significa esteticamente. Cita produttore, studio, strumenti specifici, tecniche di registrazione documentate. Almeno 2 brani dell'album come esempio concreto. (150-200 parole di prosa)

Struttura e sequenza
La logica interna dell'album. Come i brani si parlano tra loro, cosa succede dall'apertura alla chiusura. Cita i brani per nome e spiega il loro ruolo nella sequenza. (150-200 parole di prosa)

Eredità culturale
Cosa ha lasciato. Chi ha cambiato rotta dopo averlo sentito — con nomi, anni, opere specifiche. Non "ha influenzato molti artisti": nomina almeno 3. (150-200 parole di prosa)

Perché ascoltarlo oggi
Non la risposta ovvia. Argomenta con un'angolazione inaspettata — cosa si sente oggi che nel momento dell'uscita era impossibile sentire, o cosa è rimasto irrisolto e ancora aperto. (100-150 parole di prosa)

Ascolto guidato
3 brani dell'album in ordine consigliato. Formato per ogni voce — una riga ciascuna:
1. Titolo: istruzione specifica di ascolto
2. Titolo: istruzione specifica di ascolto
3. Titolo: dove porta

Frase definitiva
Una sola frase. Massimo 30 parole. Punto di vista critico netto. Non deve piacere a tutti — deve essere vera.`,
  },

  Concerto: {
    assi: ["Contesto storico", "Setlist e struttura", "Suono e performance", "Pubblico e luogo", "Perché cercarlo oggi"],
    prompt: (input) => `${PROMPT_BASE}

Analizza il concerto "${input}". Struttura l'output ESATTAMENTE così, usando questi titoli di sezione su una riga sola:

Cronologia essenziale
Formato lista, massimo 6 voci: anno — evento specifico. Solo i momenti che cambiano qualcosa.

Contesto storico
In che momento della carriera si colloca, cosa stava succedendo intorno. Cita anno, città, venue, tour di riferimento e cosa significava quel momento per l'artista. (150-200 parole di prosa)

Setlist e struttura
Come è costruita la scaletta. Cita i brani chiave per nome, i momenti di svolta della serata, il ritmo drammaturgico — apertura, climax, chiusura. (150-200 parole di prosa)

Suono e performance
Come suonava dal vivo. Differenze rispetto agli album, strumentazione live documentata, episodi specifici della performance. Cita almeno un momento memorabile con dettagli verificabili. (150-200 parole di prosa)

Pubblico e luogo
Il rapporto con la venue e con il pubblico. Capienza, atmosfera, contesto geografico e culturale. Cosa rendeva quel luogo diverso da qualsiasi altro. (100-150 parole di prosa)

Perché cercarlo oggi
Per concerti registrati: dove trovarlo, quale versione ascoltare, cosa non perdere. Per concerti leggendari senza registrazione ufficiale: perché vale la pena cercare i bootleg e cosa rivelano. (100-150 parole di prosa)

Ascolto guidato
3 registrazioni live o dischi dello stesso artista in ordine. Formato per ogni voce — una riga ciascuna:
1. Titolo — Anno: istruzione specifica di ascolto
2. Titolo — Anno: istruzione specifica di ascolto
3. Titolo — Anno: dove porta

Frase definitiva
Una sola frase. Massimo 30 parole. Punto di vista critico netto. Non deve piacere a tutti — deve essere vera.`,
  },

  Vinile: {
    assi: ["Contesto storico", "Suono e produzione", "Struttura lato A / lato B", "Collezionabilità", "Perché cercarlo oggi"],
    prompt: (input) => `${PROMPT_BASE}

Analizza il vinile "${input}". Struttura l'output ESATTAMENTE così, usando questi titoli di sezione su una riga sola:

Cronologia essenziale
Formato lista, massimo 6 voci: anno — evento specifico. Solo i momenti che cambiano qualcosa.

Contesto storico
Dove si colloca questa pubblicazione e perché quel momento contava. Cita anno, etichetta, paese di origine, contesto produttivo specifico. (150-200 parole di prosa)

Suono e produzione
Con attenzione specifica al formato fisico. Cita mastering engineer se documentato, differenze rispetto al digitale, caratteristiche tecniche della pressione originale, cosa cambia nell'ascolto su vinile. (150-200 parole di prosa)

Struttura lato A / lato B
La divisione fisica come scelta editoriale e narrativa. Analizza brano per brano la sequenza di ciascun lato — i titoli per nome — e spiega la logica della costruzione. (150-200 parole di prosa)

Collezionabilità
Edizioni, pressioni, rarità, artwork. Cita la prima pressione con paese e anno, eventuali ristampe significative, valore di mercato indicativo se documentato, dettagli dell'artwork e del packaging. (100-150 parole di prosa)

Perché cercarlo oggi
Cosa significa possedere questo disco in formato fisico oggi. Non nostalgia generica — un argomento specifico legato a questo titolo in particolare. (100-150 parole di prosa)

Ascolto guidato
3 brani del disco in ordine consigliato. Formato per ogni voce — una riga ciascuna:
1. Titolo: istruzione specifica di ascolto
2. Titolo: istruzione specifica di ascolto
3. Titolo: dove porta

Frase definitiva
Una sola frase. Massimo 30 parole. Punto di vista critico netto. Non deve piacere a tutti — deve essere vera.`,
  },
};

const COLORI_ASSI = ["#1B3A6B", "#2D6A4F", "#7B2D3E", "#8B4A00", "#3D2B6B"];

// ─── PARSING ──────────────────────────────────────────────────────────────────
function parseOutput(testo, assi) {
  const tutteLeSezioni = ["Cronologia essenziale", ...assi, "Ascolto guidato", "Frase definitiva"];
  const risultati = [];

  for (let i = 0; i < tutteLeSezioni.length; i++) {
    const nome = tutteLeSezioni[i];
    const prossimo = tutteLeSezioni[i + 1];
    const inizio = testo.indexOf(nome);
    if (inizio === -1) continue;
    const dopoNome = testo.indexOf("\n", inizio) + 1;
    let fine = testo.length;
    if (prossimo) {
      const inizioProssimo = testo.indexOf(prossimo, dopoNome);
      if (inizioProssimo !== -1) fine = inizioProssimo;
    }
    risultati.push({
      nome,
      contenuto: testo.slice(dopoNome, fine).trim(),
    });
  }
  return risultati;
}

function getSezione(sezioni, nome) {
  return sezioni.find((s) => s.nome === nome)?.contenuto || "";
}

// ─── CHIAMATA API ─────────────────────────────────────────────────────────────
async function chiamaGemini(percorso, input, onChunk, maxTentativi = 3) {
  const promptCompleto = ASSI_CONFIG[percorso].prompt(input);
  for (let tentativo = 1; tentativo <= maxTentativi; tentativo++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:streamGenerateContent?alt=sse&key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: promptCompleto }] }] }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData?.error?.status === "UNAVAILABLE" && tentativo < maxTentativi) {
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
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) onChunk(text);
          } catch { /* riga incompleta */ }
        }
      }
      return;
    } catch (e) {
      if (tentativo === maxTentativi) throw e;
      await new Promise((r) => setTimeout(r, 2000 * tentativo));
    }
  }
}

// ─── COMPONENTE TIMELINE ──────────────────────────────────────────────────────
function Cronologia({ contenuto }) {
  const righe = contenuto.split("\n").map((r) => r.replace(/^[-•]\s*/, "").trim()).filter(Boolean);
  return (
    <div style={{ marginBottom: "40px", position: "relative" }}>
      {/* Linea orizzontale */}
      <div style={{
        position: "absolute", top: "10px", left: "0", right: "0",
        height: "1px", backgroundColor: "#ccc", zIndex: 0,
      }} />
      <div style={{ display: "flex", gap: "0", overflowX: "auto", paddingBottom: "8px", position: "relative", zIndex: 1 }}>
        {righe.map((r, i) => {
          const sepIdx = r.indexOf("—");
          const anno = sepIdx !== -1 ? r.slice(0, sepIdx).trim() : "";
          const evento = sepIdx !== -1 ? r.slice(sepIdx + 1).trim() : r;
          return (
            <div key={i} style={{ flex: "1", minWidth: "120px", maxWidth: "200px", paddingRight: "16px", position: "relative" }}>
              {/* Punto sulla linea */}
              <div style={{
                width: "10px", height: "10px", borderRadius: "50%",
                backgroundColor: "#111", marginBottom: "12px",
                border: "2px solid #F5F2EE", boxShadow: "0 0 0 1px #111",
              }} />
              <p style={{ fontSize: "0.7rem", fontWeight: "bold", color: "#111", margin: "0 0 4px", letterSpacing: "0.5px" }}>{anno}</p>
              <p style={{ fontSize: "0.78rem", color: "#555", lineHeight: "1.4", margin: 0 }}>{evento}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── COMPONENTE PLAYER ────────────────────────────────────────────────────────
function AscoltoGuidato({ contenuto }) {
  const righe = contenuto.split("\n").map((r) => r.replace(/^\d+\.\s*/, "").trim()).filter(Boolean);
  return (
    <div style={{
      backgroundColor: "#111",
      borderRadius: "16px",
      padding: "24px",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      gap: "0",
      height: "100%",
      boxSizing: "border-box",
    }}>
      <p style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "2px", opacity: 0.4, margin: "0 0 20px" }}>
        Ascolto guidato
      </p>
      {righe.map((r, i) => {
        const colonIdx = r.indexOf(":");
        const titolo = colonIdx !== -1 ? r.slice(0, colonIdx).trim() : r;
        const istruzione = colonIdx !== -1 ? r.slice(colonIdx + 1).trim() : "";
        const isMiddle = i === 1;
        return (
          <div key={i} style={{
            padding: "14px 0",
            borderBottom: i < righe.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
            display: "flex",
            alignItems: "flex-start",
            gap: "14px",
          }}>
            {/* Icona play / cerchio */}
            <div style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              backgroundColor: isMiddle ? "#fff" : "rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: "2px",
            }}>
              <div style={{
                width: 0,
                height: 0,
                borderTop: "5px solid transparent",
                borderBottom: "5px solid transparent",
                borderLeft: isMiddle ? "8px solid #111" : "8px solid rgba(255,255,255,0.5)",
                marginLeft: "2px",
              }} />
            </div>
            <div>
              <p style={{
                fontSize: isMiddle ? "0.95rem" : "0.85rem",
                fontWeight: isMiddle ? "bold" : "normal",
                margin: "0 0 4px",
                opacity: isMiddle ? 1 : 0.7,
              }}>{titolo}</p>
              {istruzione && (
                <p style={{ fontSize: "0.75rem", opacity: 0.45, margin: 0, lineHeight: "1.4", fontStyle: "italic" }}>
                  {istruzione}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [percorso, setPercorso] = useState("Artista");
  const [input, setInput] = useState("");
  const [outputRaw, setOutputRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState("");
  const [titoloRicerca, setTitoloRicerca] = useState("");
  const [completato, setCompletato] = useState(false);

  const config = ASSI_CONFIG[percorso];
  const sezioni = completato ? parseOutput(outputRaw, config.assi) : [];
  const cronologia = getSezione(sezioni, "Cronologia essenziale");
  const assiSezioni = sezioni.filter((s) => config.assi.includes(s.nome));
  const ascolto = getSezione(sezioni, "Ascolto guidato");
  const frase = getSezione(sezioni, "Frase definitiva");

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
    let testo = "";
    try {
      await chiamaGemini(percorso, input, (chunk) => {
        testo += chunk;
        setOutputRaw(testo);
      });
      setCompletato(true);
    } catch (e) {
      console.error(e);
      setErrore(
        e.message.includes("UNAVAILABLE")
          ? "Gemini è sovraccarico. Riprova tra qualche secondo."
          : "Qualcosa è andato storto. Riprova."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      fontFamily: "Georgia, serif",
      minHeight: "100vh",
      backgroundColor: "#F5F2EE",
      padding: "32px 16px",
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
    }}>

      {/* Header */}
      <div style={{ maxWidth: "960px", margin: "0 auto", textAlign: "center", marginBottom: "32px", width: "100%" }}>
        <h1 style={{ fontSize: "clamp(2rem, 8vw, 3rem)", fontWeight: "bold", letterSpacing: "-1px", marginBottom: "6px" }}>Liner</h1>
        <p style={{ color: "#666", fontSize: "clamp(0.85rem, 3vw, 1rem)" }}>Esplorazione musicale consapevole</p>
      </div>

      {/* Selettore percorso */}
      <div style={{
        maxWidth: "960px", margin: "0 auto", display: "flex", justifyContent: "center",
        gap: "8px", marginBottom: "24px", flexWrap: "wrap", width: "100%",
        padding: "0 8px", boxSizing: "border-box",
      }}>
        {PERCORSI.map((p) => (
          <button key={p} onClick={() => handlePercorso(p)} style={{
            padding: "7px 16px", borderRadius: "999px", border: "2px solid #111",
            backgroundColor: percorso === p ? "#111" : "transparent",
            color: percorso === p ? "#fff" : "#111",
            fontFamily: "Georgia, serif", fontSize: "clamp(0.8rem, 3vw, 0.95rem)",
            cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
          }}>
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ maxWidth: "600px", margin: "0 auto", marginBottom: "32px", width: "100%", padding: "0 8px", boxSizing: "border-box" }}>
        <input
          type="text"
          placeholder={`Inserisci un ${percorso.toLowerCase()}...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleEsplora()}
          style={{
            width: "100%", padding: "14px 20px", fontSize: "clamp(0.9rem, 3.5vw, 1rem)",
            fontFamily: "Georgia, serif", border: "2px solid #111", borderRadius: "8px",
            marginBottom: "12px", backgroundColor: "#fff", boxSizing: "border-box",
          }}
        />
        <button onClick={handleEsplora} disabled={loading} style={{
          width: "100%", padding: "14px 40px", backgroundColor: "#111", color: "#fff",
          border: "none", borderRadius: "8px", fontFamily: "Georgia, serif",
          fontSize: "clamp(0.9rem, 3.5vw, 1rem)", cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1, transition: "opacity 0.2s",
        }}>
          {loading ? "Sto esplorando..." : "Esplora"}
        </button>
      </div>

      {/* Errore */}
      {errore && (
        <div style={{ maxWidth: "960px", margin: "0 auto 24px", color: "#c00", textAlign: "center", width: "100%", padding: "0 16px" }}>
          {errore}
        </div>
      )}

      {/* Streaming in corso */}
      {loading && outputRaw && (
        <div style={{
          maxWidth: "960px", margin: "0 auto", padding: "20px", backgroundColor: "#fff",
          borderRadius: "12px", border: "1px solid #ddd", whiteSpace: "pre-wrap",
          fontFamily: "Georgia, serif", lineHeight: "1.7", color: "#333",
          width: "100%", boxSizing: "border-box",
        }}>
          {outputRaw}
        </div>
      )}

      {/* Output finale */}
      {completato && sezioni.length > 0 && (
        <div style={{ maxWidth: "960px", margin: "0 auto", width: "100%", padding: "0 8px", boxSizing: "border-box" }}>

          {/* Titolo */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <p style={{ fontSize: "0.75rem", color: "#999", textTransform: "uppercase", letterSpacing: "3px", marginBottom: "8px" }}>{percorso}</p>
            <h2 style={{ fontSize: "clamp(1.6rem, 6vw, 2.4rem)", fontWeight: "bold", color: "#111", margin: 0 }}>{titoloRicerca}</h2>
          </div>

          {/* 1. CRONOLOGIA — timeline orizzontale */}
          {cronologia && <Cronologia contenuto={cronologia} />}

          {/* 2. GRIGLIA ASSI + PLAYER AFFIANCATO */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "16px",
            marginBottom: "32px",
          }}>
            {/* Riga con griglia assi a sinistra e player a destra */}
            <div style={{
              display: "grid",
              gridTemplateColumns: ascolto ? "1fr 280px" : "1fr",
              gap: "16px",
              alignItems: "start",
            }}>
              {/* Griglia assi 2:2:1 */}
              <div>
                {/* Prima riga — 2 box */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  {assiSezioni.slice(0, 2).map((s, i) => (
                    <div key={i} style={{
                      backgroundColor: COLORI_ASSI[i], borderRadius: "12px", padding: "24px",
                      color: "#fff", animation: `fadeInUp 0.4s ease ${i * 0.1}s both`,
                    }}>
                      <p style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "2px", opacity: 0.6, margin: "0 0 10px" }}>{s.nome}</p>
                      <p style={{ fontSize: "clamp(0.85rem, 2.5vw, 0.95rem)", lineHeight: "1.75", margin: 0 }}>{s.contenuto}</p>
                    </div>
                  ))}
                </div>
                {/* Seconda riga — 2 box */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  {assiSezioni.slice(2, 4).map((s, i) => (
                    <div key={i} style={{
                      backgroundColor: COLORI_ASSI[i + 2], borderRadius: "12px", padding: "24px",
                      color: "#fff", animation: `fadeInUp 0.4s ease ${(i + 2) * 0.1}s both`,
                    }}>
                      <p style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "2px", opacity: 0.6, margin: "0 0 10px" }}>{s.nome}</p>
                      <p style={{ fontSize: "clamp(0.85rem, 2.5vw, 0.95rem)", lineHeight: "1.75", margin: 0 }}>{s.contenuto}</p>
                    </div>
                  ))}
                </div>
                {/* Terza riga — 1 box largo */}
                {assiSezioni[4] && (
                  <div style={{
                    backgroundColor: COLORI_ASSI[4], borderRadius: "12px", padding: "24px",
                    color: "#fff", animation: `fadeInUp 0.4s ease 0.4s both`,
                  }}>
                    <p style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "2px", opacity: 0.6, margin: "0 0 10px" }}>{assiSezioni[4].nome}</p>
                    <p style={{ fontSize: "clamp(0.85rem, 2.5vw, 0.95rem)", lineHeight: "1.75", margin: 0 }}>{assiSezioni[4].contenuto}</p>
                  </div>
                )}
              </div>

              {/* Player ascolto guidato — colonna destra */}
              {ascolto && <AscoltoGuidato contenuto={ascolto} />}
            </div>
          </div>

          {/* 3. FRASE DEFINITIVA — testo semplice */}
          {frase && (
            <div style={{ textAlign: "center", padding: "32px 16px 48px", borderTop: "1px solid #ddd" }}>
              <p style={{ fontSize: "clamp(1rem, 3vw, 1.2rem)", color: "#333", fontStyle: "italic", lineHeight: "1.6", maxWidth: "600px", margin: "0 auto" }}>
                "{frase}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ maxWidth: "960px", margin: "auto auto 0", width: "100%", textAlign: "center", borderTop: "1px solid #ddd", paddingTop: "24px" }}>
        <p style={{ fontSize: "0.8rem", color: "#999" }}>
          Le analisi di Liner sono generate con il supporto di Gemini, il modello AI di Google.
        </p>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 640px) {
          .griglia-assi { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}