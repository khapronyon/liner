import { useState } from "react";

const PERCORSI = ["Artista", "Album", "Brano", "Concerto", "Vinile"];
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// ─── PROMPT BASE ──────────────────────────────────────────────────────────────
const PROMPT_BASE = `Sei un critico musicale con trent'anni di esperienza in elettronica, post-punk, rock, alternative e jazz.
Scrivi come un saggista di settore: autorevolezza, precisione, punto di vista netto.
Non sei un'enciclopedia generica — ogni frase deve guadagnarsi il diritto di stare lì.

REGOLA PRIORITARIA — prima di tutto il resto:
Se il soggetto non ti è specificato con artista, interpreta il titolo nel modo più probabile e procedi con l'analisi — specificando tu stesso nella Scheda tecnica quale versione stai analizzando. Solo se il soggetto non esiste o non ti è noto in modo sufficiente per compilare almeno 3 assi con fatti reali, rispondi SOLO con questa frase esatta:
"Non ho informazioni sufficienti su questo soggetto per produrre un'analisi affidabile."
Non aggiungere nulla. È preferibile non rispondere che inventare.

REGOLE SULL'ACCURATEZZA — in ordine di priorità:
1. Fatti certi e documentati: scrivili con sicurezza.
2. Fatti molto probabili e storicamente consolidati (es. un album pubblicato da una major negli anni '90): scrivili, sono accettabili.
3. Dettagli specifici incerti (nome esatto dello studio, data precisa di una sessione, nome di un ingegnere del suono minore): omettili o usa formule come "registrato a Los Angeles" senza nominare lo studio se non lo sai con certezza.
4. Versi di testi, titoli di brani, nomi di persone reali: MASSIMA PRECISIONE. Non citare mai versi di un brano per descrivere un altro brano dello stesso artista. Non attribuire dichiarazioni a persone reali senza certezza.
5. Se inventi qualcosa che sembra plausibile ma non è verificabile: NON farlo. Riduci la lunghezza della sezione invece di riempire con speculazioni.

VINCOLI OBBLIGATORI:
- Non confondere MAI testi, brani, titoli o dettagli di un soggetto con quelli di un altro soggetto dello stesso artista.
- Non collegare artisti per influenza solo perché condividono un genere: l'influenza deve essere documentata o storicamente evidente.
- Non attribuire MAI dichiarazioni o citazioni a persone reali senza certezza documentata.
- Tono: saggistico, diretto, mai entusiasta o promozionale. Puoi essere critico.
- Se l'artista non è specificato, scegli l'interpretazione più nota e consolidata del titolo, specificala nella Scheda tecnica, e procedi. Non bloccarti per ambiguità.
- Lingua: italiano. Nessun grassetto, nessun elenco puntato, nessun titolo numerato. Solo prosa sciolta.`;

// ─── BLOCCHI SEZIONE RIUSABILI ────────────────────────────────────────────────
const CRONOLOGIA = `Cronologia essenziale
Massimo 6 voci in formato: anno — evento specifico.
Includi SOLO eventi che conosci con certezza documentata. Se non sei sicuro di un anno esatto, non includerlo. È preferibile una cronologia di 3 voci certe che una di 6 con alcune inventate.`;

const ASCOLTO_GUIDATO = `Ascolto guidato
Costruisci un percorso di ascolto coerente di 5 brani.
COERENZA: ogni brano deve avere una relazione precisa e documentabile con il soggetto — per influenza diretta storica, per contesto condiviso verificabile, per parentela sonora evidente e specifica. NON scegliere brani per associazione vaga di genere o per popolarità generica.
ESISTENZA: cita SOLO brani che esistono realmente con titolo e artista corretti.
Il soggetto principale occupa sempre la posizione 3.
Formato — una riga per brano, esattamente così:
1. Titolo — Artista: [perché ascoltarlo prima, cosa prepara in relazione al soggetto]
2. Titolo — Artista: [connessione specifica e documentabile con il soggetto]
3. Titolo — Artista: [cosa ascoltare in modo specifico]
4. Titolo — Artista: [cosa cambia, dove si va — con motivazione precisa]
5. Titolo — Artista: [dove porta questo percorso — con motivazione precisa]`;

const FRASE_DEFINITIVA = `Frase definitiva
Una sola frase. Massimo 30 parole. Punto di vista critico netto. Non deve piacere a tutti — deve essere vera.`;

// ─── ASSI CONFIG ──────────────────────────────────────────────────────────────
const ASSI_CONFIG = {
  Brano: {
    assi: ["Scheda tecnica", "Genesi", "Anatomia sonora", "Posizione storica", "Testo e voce", "Perché ancora"],
    prompt: (input, artista) => `${PROMPT_BASE}

Analizza il brano "${input}"${artista ? ` di ${artista}` : ""}. Struttura l'output ESATTAMENTE con questi titoli di sezione su una riga sola, nell'ordine indicato:

${CRONOLOGIA}

Scheda tecnica
Compila SOLO i campi che conosci con certezza. Per i campi incerti scrivi "n.d." invece di inventare.
Titolo: [titolo esatto del brano]
Artista: [nome artista o band]
Album: [album di appartenenza, o "Singolo", o "n.d." se incerto]
Anno: [anno di pubblicazione, o decennio se l'anno esatto è incerto]
Genere: [genere principale e sottogenere se rilevante]
Etichetta: [etichetta discografica, o "n.d." se incerta]
Produttore: [nome produttore/i, o "n.d." se incerto]

Genesi
Come è nato questo brano. Cita anno, luogo o studio di registrazione, produttore — SOLO se li conosci con certezza. Se non conosci il nome dello studio, non inventarlo. Includi almeno un dettaglio specifico e verificabile sulla sessione o sul periodo compositivo. (150-200 parole di prosa)

Anatomia sonora
Cosa si sente e perché conta. Struttura del brano, strumentazione, scelte di produzione distintive. Cita almeno 2 elementi tecnici specifici che sono EFFETTIVAMENTE presenti e udibili in questo brano — non elementi generici del genere o dell'artista. Se non sei certo di quale strumento specifico è stato usato, descrivi l'effetto sonoro invece di nominare lo strumento. (150-200 parole di prosa)

Posizione storica
Dove si colloca questo brano nella storia della musica. Cita almeno 2 artisti o movimenti che lo hanno preceduto e influenzato — SOLO se l'influenza è documentata o storicamente evidente, non per associazione vaga di genere. Cita almeno 2 artisti o opere successive che ha influenzato — con anni e titoli specifici, e solo se l'influenza è documentabile. (150-200 parole di prosa)

Testo e voce
Analizza il testo e la performance vocale del brano "${input}"${artista ? ` di ${artista}` : ""}.
REGOLA CRITICA: se citi versi tra virgolette, devono appartenere ESCLUSIVAMENTE a questo brano specifico — non ad altri brani dello stesso artista, non a brani con titolo simile, non a brani dello stesso album. Se non ricordi con certezza assoluta i versi di questo brano specifico, NON citare versi: descrivi temi, mood e performance vocale senza virgolette. Analizza ciò che si ascolta effettivamente in questo brano. Se strumentale, analizza la melodia principale come se fosse una voce. (100-150 parole di prosa)

Perché ancora
Perché questo brano conta oggi. Argomenta con riferimenti concreti e verificabili: campionamenti documentati con artista e anno, cover significative con artista e anno, usi in film o serie con titolo verificabile. Se non hai riferimenti concreti sufficienti, riduci la sezione invece di speculare. (100-150 parole di prosa)

${ASCOLTO_GUIDATO}

${FRASE_DEFINITIVA}`,
  },

  Artista: {
    assi: ["Scheda tecnica", "Traiettoria", "Suono e identità", "Influenze", "Eredità e impatto", "Da dove iniziare"],
    prompt: (input) => `${PROMPT_BASE}

Analizza l'artista "${input}". Struttura l'output ESATTAMENTE con questi titoli di sezione su una riga sola, nell'ordine indicato:

${CRONOLOGIA}

Scheda tecnica
Compila SOLO i campi che conosci con certezza. Per i campi incerti scrivi "n.d." invece di inventare.
Nome: [nome artista o band]
Origine: [città e paese]
Attivo dal: [anno di inizio attività, o decennio se incerto]
Genere: [genere principale e sottogenere se rilevante]
Etichetta: [etichetta attuale o più rilevante, o "n.d." se incerta]
Formazione: [membri principali se band, o "Solista"]
Disco più noto: [titolo e anno — SOLO se sei certo che esiste]

Traiettoria
Come si è evoluto nel tempo. Cita i momenti di svolta con anni precisi, i dischi che segnano ogni fase, i cambi di lineup o direzione artistica documentati — SOLO eventi che conosci con certezza. (150-200 parole di prosa)

Suono e identità
Cosa lo rende riconoscibile. Cita strumenti specifici, tecniche produttive, collaboratori ricorrenti — SOLO se li conosci con certezza documentata per questo artista specifico, non per generalizzazione di genere. (150-200 parole di prosa)

Influenze
Da dove viene. Cita almeno 3 artisti o movimenti con anni e dischi specifici — SOLO se l'influenza è documentata o dichiarata dall'artista stesso o storicamente evidente. Non collegare artisti solo perché condividono un genere. Spiega il meccanismo specifico dell'influenza. (150-200 parole di prosa)

Eredità e impatto
Chi ha influenzato. Cita almeno 3 artisti successivi con anni e opere specifiche — SOLO se l'influenza è documentabile, non per associazione vaga. Spiega in cosa consiste concretamente. (150-200 parole di prosa)

Da dove iniziare
Il punto di ingresso consigliato per chi non lo conosce. Non necessariamente il disco più famoso — quello più rivelatore. Spiega perché questo e non un altro, con riferimenti a brani specifici che esistono realmente. (100-150 parole di prosa)

${ASCOLTO_GUIDATO.replace(
  "Il soggetto principale occupa sempre la posizione 3.",
  "Il soggetto è l'artista: includi almeno 2 suoi brani o dischi nella sequenza (posizioni 2 e 3). Gli altri 3 brani devono avere connessione documentabile con questo artista specifico."
)}

${FRASE_DEFINITIVA}`,
  },

  Album: {
    assi: ["Scheda tecnica", "Contesto storico", "Suono e produzione", "Struttura e sequenza", "Eredità culturale", "Perché ascoltarlo oggi"],
    prompt: (input, artista) => `${PROMPT_BASE}

Analizza l'album "${input}"${artista ? ` di ${artista}` : ""}. Struttura l'output ESATTAMENTE con questi titoli di sezione su una riga sola, nell'ordine indicato:

${CRONOLOGIA}

Scheda tecnica
Compila SOLO i campi che conosci con certezza. Per i campi incerti scrivi "n.d." invece di inventare.
Titolo: [titolo esatto dell'album]
Artista: [nome artista o band]
Anno: [anno di pubblicazione, o decennio se incerto]
Genere: [genere principale e sottogenere se rilevante]
Etichetta: [etichetta discografica, o "n.d." se incerta]
Produttore: [nome produttore/i, o "n.d." se incerto]
Durata: [durata totale approssimativa, o "n.d." se incerta]

Contesto storico
Dove si colloca questo album e perché quel momento contava. Cita anno, etichetta, cosa stava succedendo musicalmente e culturalmente — con riferimenti specifici e verificabili. (150-200 parole di prosa)

Suono e produzione
Cosa succede tecnicamente e cosa significa esteticamente. Cita produttore, studio, strumenti specifici, tecniche di registrazione — SOLO se documentati per questo album specifico. Usa almeno 2 brani dell'album come esempio concreto, citandoli per nome corretto. (150-200 parole di prosa)

Struttura e sequenza
La logica interna dell'album. Come i brani si parlano tra loro, cosa succede dall'apertura alla chiusura. Cita i brani per nome — SOLO i titoli corretti di questo album, non di altri album dello stesso artista. (150-200 parole di prosa)

Eredità culturale
Cosa ha lasciato. Chi ha cambiato rotta dopo averlo sentito — con nomi, anni, opere specifiche e documentabili. Non "ha influenzato molti artisti": nomina almeno 3 con connessione verificabile. (150-200 parole di prosa)

Perché ascoltarlo oggi
Non la risposta ovvia. Argomenta con un'angolazione inaspettata e concreta — cosa si sente oggi che nel momento dell'uscita era impossibile sentire, o cosa è rimasto irrisolto. Nessuna speculazione non supportata. (100-150 parole di prosa)

${ASCOLTO_GUIDATO.replace(
  "Il soggetto principale occupa sempre la posizione 3.",
  "L'album è il soggetto: includi almeno 2 brani di questo album nelle posizioni 2 e 3. Cita i titoli corretti — non brani di altri album dello stesso artista."
)}

${FRASE_DEFINITIVA}`,
  },

  Concerto: {
    assi: ["Scheda tecnica", "Contesto storico", "Setlist e struttura", "Suono e performance", "Pubblico e luogo", "Perché cercarlo oggi"],
    prompt: (input, artista) => `${PROMPT_BASE}

Analizza il concerto "${input}"${artista ? ` di ${artista}` : ""}. Struttura l'output ESATTAMENTE con questi titoli di sezione su una riga sola, nell'ordine indicato:

${CRONOLOGIA}

Scheda tecnica
Compila SOLO i campi che conosci con certezza. Per i campi incerti scrivi "n.d." invece di inventare.
Artista: [nome artista o band]
Data: [data o periodo del concerto, o "n.d." se incerta]
Venue: [nome della venue, o "n.d." se incerta]
Città: [città e paese]
Tour: [nome del tour se applicabile, o "n.d."]
Registrazione: [sì / no / parziale / n.d.]

Contesto storico
In che momento della carriera si colloca, cosa stava succedendo intorno. Cita anno, città, venue, tour — SOLO informazioni che conosci con certezza per questo concerto specifico. (150-200 parole di prosa)

Setlist e struttura
Come è costruita la scaletta. Cita i brani chiave per nome — SOLO brani che sai con certezza essere stati eseguiti in questo concerto specifico, non la scaletta generica dell'artista. Se non conosci la scaletta precisa, descrivi la struttura generale senza inventare titoli. (150-200 parole di prosa)

Suono e performance
Come suonava dal vivo. Differenze rispetto agli album, strumentazione live documentata. Cita episodi specifici della performance — SOLO se documentati, non ricostruiti. (150-200 parole di prosa)

Pubblico e luogo
Il rapporto con la venue e con il pubblico. Capienza, atmosfera, contesto geografico e culturale — con dati verificabili. (100-150 parole di prosa)

Perché cercarlo oggi
Per concerti registrati: dove trovarlo, quale versione ascoltare, cosa non perdere. Per concerti senza registrazione ufficiale: perché vale la pena cercare i bootleg e cosa rivelano. (100-150 parole di prosa)

${ASCOLTO_GUIDATO.replace(
  "Il soggetto principale occupa sempre la posizione 3.",
  "Il percorso deve guidare verso e oltre questo concerto specifico: usa registrazioni live documentate dello stesso artista o brani che aiutano a capire quel momento preciso della carriera."
)}

${FRASE_DEFINITIVA}`,
  },

  Vinile: {
    assi: ["Scheda tecnica", "Contesto storico", "Suono e produzione", "Struttura lato A / lato B", "Collezionabilità", "Perché cercarlo oggi"],
    prompt: (input, artista) => `${PROMPT_BASE}

Analizza il vinile "${input}"${artista ? ` di ${artista}` : ""}. Struttura l'output ESATTAMENTE con questi titoli di sezione su una riga sola, nell'ordine indicato:

${CRONOLOGIA}

Scheda tecnica
Compila SOLO i campi che conosci con certezza. Per i campi incerti scrivi "n.d." invece di inventare.
Titolo: [titolo esatto]
Artista: [nome artista o band]
Anno prima pressione: [anno, o decennio se incerto]
Paese di origine: [paese]
Etichetta: [etichetta originale, o "n.d." se incerta]
Formato: [LP / EP / Singolo / altro]
Produttore: [nome produttore/i, o "n.d." se incerto]

Contesto storico
Dove si colloca questa pubblicazione e perché quel momento contava. Cita anno, etichetta, paese di origine, contesto produttivo — SOLO con dati verificabili. (150-200 parole di prosa)

Suono e produzione
Con attenzione specifica al formato fisico. Cita mastering engineer SOLO se documentato. Descrivi le differenze rispetto al digitale e le caratteristiche della pressione originale — SOLO quelle che conosci con certezza per questa specifica edizione. (150-200 parole di prosa)

Struttura lato A / lato B
La divisione fisica come scelta editoriale e narrativa. Cita i titoli dei brani per nome — SOLO i titoli corretti di questo disco, nell'ordine corretto. Se non sei certo dell'ordine esatto dei brani, descrivi la struttura generale senza inventare sequenze. (150-200 parole di prosa)

Collezionabilità
Edizioni, pressioni, rarità, artwork. Cita la prima pressione con paese e anno SOLO se documentati. Valore di mercato SOLO se hai dati verificabili. Non inventare cifre. (100-150 parole di prosa)

Perché cercarlo oggi
Cosa significa possedere questo disco in formato fisico oggi. Un argomento specifico e concreto legato a questo titolo in particolare — non nostalgia generica. (100-150 parole di prosa)

${ASCOLTO_GUIDATO.replace(
  "Il soggetto principale occupa sempre la posizione 3.",
  "Il percorso deve guidare all'ascolto fisico e contestuale: privilegia dischi con storia editoriale interessante o che suonano in modo distintivo su vinile. Cita SOLO titoli che esistono realmente."
)}

${FRASE_DEFINITIVA}`,
  },
};

// ─── COLORI ───────────────────────────────────────────────────────────────────
const COLORI_ASSI = ["#111111", "#1B3A6B", "#2D6A4F", "#7B2D3E", "#8B4A00", "#3D2B6B"];

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
    risultati.push({ nome, contenuto: testo.slice(dopoNome, fine).trim() });
  }
  return risultati;
}

function getSezione(sezioni, nome) {
  return sezioni.find((s) => s.nome === nome)?.contenuto || "";
}

// ─── CHIAMATA API ─────────────────────────────────────────────────────────────
async function chiamaGemini(percorso, input, artista, onChunk, maxTentativi = 3) {
  const promptCompleto = ASSI_CONFIG[percorso].prompt(input, artista);
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

// ─── COMPONENTI ───────────────────────────────────────────────────────────────
function Cronologia({ contenuto }) {
  const righe = contenuto.split("\n").map((r) => r.replace(/^[-•]\s*/, "").trim()).filter(Boolean);
  return (
    <div style={{ marginBottom: "40px", position: "relative" }}>
      <div style={{ position: "absolute", top: "10px", left: "0", right: "0", height: "1px", backgroundColor: "#ccc", zIndex: 0 }} />
      <div style={{ display: "flex", overflowX: "auto", paddingBottom: "8px", position: "relative", zIndex: 1 }}>
        {righe.map((r, i) => {
          const sepIdx = r.indexOf("—");
          const anno = sepIdx !== -1 ? r.slice(0, sepIdx).trim() : "";
          const evento = sepIdx !== -1 ? r.slice(sepIdx + 1).trim() : r;
          return (
            <div key={i} style={{ flex: "1", minWidth: "130px", maxWidth: "200px", paddingRight: "16px", position: "relative" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#111", marginBottom: "12px", border: "2px solid #F5F2EE", boxShadow: "0 0 0 1px #111" }} />
              <p style={{ fontSize: "0.7rem", fontWeight: "bold", color: "#111", margin: "0 0 4px" }}>{anno}</p>
              <p style={{ fontSize: "0.78rem", color: "#555", lineHeight: "1.4", margin: 0 }}>{evento}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SchedaTecnica({ contenuto }) {
  const righe = contenuto.split("\n").map((r) => r.trim()).filter((r) => r.includes(":"));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {righe.map((r, i) => {
        const colonIdx = r.indexOf(":");
        const chiave = r.slice(0, colonIdx).trim();
        const valore = r.slice(colonIdx + 1).trim();
        return (
          <div key={i} style={{ display: "flex", gap: "12px", alignItems: "baseline" }}>
            <span style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "1.5px", opacity: 0.5, minWidth: "80px", flexShrink: 0 }}>{chiave}</span>
            <span style={{ fontSize: "0.9rem", lineHeight: "1.4" }}>{valore}</span>
          </div>
        );
      })}
    </div>
  );
}

function AscoltoGuidato({ contenuto }) {
  const righe = contenuto.split("\n").map((r) => r.replace(/^\d+\.\s*/, "").trim()).filter(Boolean);
  return (
    <div style={{ backgroundColor: "#111", borderRadius: "16px", padding: "28px", color: "#fff" }}>
      <p style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "2px", opacity: 0.4, margin: "0 0 20px" }}>
        Ascolto guidato
      </p>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {righe.map((r, i) => {
          const colonIdx = r.indexOf(":");
          const titolo = colonIdx !== -1 ? r.slice(0, colonIdx).trim() : r;
          const istruzione = colonIdx !== -1 ? r.slice(colonIdx + 1).trim() : "";
          const isCentrale = i === 2;
          return (
            <div key={i} style={{ padding: "14px 0", borderBottom: i < righe.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none", display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0, marginTop: "2px", backgroundColor: isCentrale ? "#fff" : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {isCentrale ? (
                  <div style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: "8px solid #111", marginLeft: "2px" }} />
                ) : (
                  <span style={{ fontSize: "0.65rem", opacity: 0.5 }}>{i + 1}</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: isCentrale ? "1rem" : "0.88rem", fontWeight: isCentrale ? "bold" : "normal", margin: "0 0 4px", opacity: isCentrale ? 1 : 0.75 }}>{titolo}</p>
                {istruzione && <p style={{ fontSize: "0.75rem", opacity: 0.4, margin: 0, lineHeight: "1.5", fontStyle: "italic" }}>{istruzione}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NonTrovato({ input }) {
  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", width: "100%", textAlign: "center", padding: "64px 24px" }}>
      <p style={{ fontSize: "2rem", marginBottom: "16px" }}>🎧</p>
      <p style={{ fontSize: "clamp(1.1rem, 3vw, 1.3rem)", color: "#111", fontWeight: "bold", marginBottom: "12px" }}>
        La tua conoscenza musicale supera la nostra.
      </p>
      <p style={{ fontSize: "clamp(0.85rem, 2.5vw, 1rem)", color: "#666", lineHeight: "1.7", maxWidth: "480px", margin: "0 auto 20px" }}>
        Non abbiamo trovato informazioni sufficienti su <em>"{input}"</em> per produrre un'analisi affidabile. Preferiamo il silenzio all'invenzione.
      </p>
      <p style={{ fontSize: "0.82rem", color: "#999" }}>
        Prova ad aggiungere il nome dell'artista nel campo apposito.
      </p>
    </div>
  );
}

function BoxAsse({ s, colore, children }) {
  return (
    <div style={{ backgroundColor: colore, borderRadius: "12px", padding: "24px", color: "#fff" }}>
      <p style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "2px", opacity: 0.6, margin: "0 0 12px" }}>{s.nome}</p>
      {children || <p style={{ fontSize: "clamp(0.85rem, 2.5vw, 0.95rem)", lineHeight: "1.75", margin: 0 }}>{s.contenuto}</p>}
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [percorso, setPercorso] = useState("Artista");
  const [input, setInput] = useState("");
  const [artista, setArtista] = useState("");
  const [outputRaw, setOutputRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState("");
  const [titoloRicerca, setTitoloRicerca] = useState("");
  const [completato, setCompletato] = useState(false);

  const mostraArtista = percorso !== "Artista";
  const config = ASSI_CONFIG[percorso];
  const nonTrovato = completato && outputRaw.includes("Non ho informazioni sufficienti");
  const sezioni = completato && !nonTrovato ? parseOutput(outputRaw, config.assi) : [];
  const cronologia = getSezione(sezioni, "Cronologia essenziale");
  const schedaTecnica = getSezione(sezioni, "Scheda tecnica");
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
    setArtista("");
  }

  async function handleEsplora() {
    if (!input.trim()) return;
    setLoading(true);
    setOutputRaw("");
    setErrore("");
    const titolo = artista.trim() ? `${input} — ${artista}` : input;
    setTitoloRicerca(titolo);
    setCompletato(false);
    let testo = "";
    try {
      await chiamaGemini(percorso, input, artista.trim(), (chunk) => {
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
    <div style={{ fontFamily: "Georgia, serif", minHeight: "100vh", backgroundColor: "#F5F2EE", padding: "32px 16px", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>

      {/* Header */}
      <div style={{ maxWidth: "960px", margin: "0 auto", textAlign: "center", marginBottom: "32px", width: "100%" }}>
        <h1 style={{ fontSize: "clamp(2rem, 8vw, 3rem)", fontWeight: "bold", letterSpacing: "-1px", marginBottom: "6px" }}>Liner</h1>
        <p style={{ color: "#666", fontSize: "clamp(0.85rem, 3vw, 1rem)" }}>Esplorazione musicale consapevole</p>
      </div>

      {/* Selettore percorso */}
      <div style={{ maxWidth: "960px", margin: "0 auto", display: "flex", justifyContent: "center", gap: "8px", marginBottom: "24px", flexWrap: "wrap", width: "100%", padding: "0 8px", boxSizing: "border-box" }}>
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
          style={{ width: "100%", padding: "14px 20px", fontSize: "clamp(0.9rem, 3.5vw, 1rem)", fontFamily: "Georgia, serif", border: "2px solid #111", borderRadius: "8px", marginBottom: "10px", backgroundColor: "#fff", boxSizing: "border-box" }}
        />
        {mostraArtista && (
          <input
            type="text"
            placeholder="Artista (opzionale, ma consigliato)"
            value={artista}
            onChange={(e) => setArtista(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEsplora()}
            style={{ width: "100%", padding: "12px 20px", fontSize: "clamp(0.85rem, 3vw, 0.95rem)", fontFamily: "Georgia, serif", border: "2px solid #ccc", borderRadius: "8px", marginBottom: "10px", backgroundColor: "#fff", boxSizing: "border-box", color: "#555" }}
          />
        )}
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

      {/* Streaming */}
      {loading && outputRaw && (
        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "20px", backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #ddd", whiteSpace: "pre-wrap", fontFamily: "Georgia, serif", lineHeight: "1.7", color: "#333", width: "100%", boxSizing: "border-box" }}>
          {outputRaw}
        </div>
      )}

      {/* Non trovato */}
      {nonTrovato && <NonTrovato input={titoloRicerca} />}

      {/* Output finale */}
      {completato && !nonTrovato && sezioni.length > 0 && (
        <div style={{ maxWidth: "960px", margin: "0 auto", width: "100%", padding: "0 8px", boxSizing: "border-box" }}>

          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <p style={{ fontSize: "0.75rem", color: "#999", textTransform: "uppercase", letterSpacing: "3px", marginBottom: "8px" }}>{percorso}</p>
            <h2 style={{ fontSize: "clamp(1.6rem, 6vw, 2.4rem)", fontWeight: "bold", color: "#111", margin: 0 }}>{titoloRicerca}</h2>
          </div>

          {cronologia && <Cronologia contenuto={cronologia} />}

          <div className="griglia-box">
            {schedaTecnica && (
              <BoxAsse s={{ nome: "Scheda tecnica" }} colore={COLORI_ASSI[0]}>
                <SchedaTecnica contenuto={schedaTecnica} />
              </BoxAsse>
            )}
            {assiSezioni.filter(s => s.nome !== "Scheda tecnica").map((s, i) => (
              <BoxAsse key={i} s={s} colore={COLORI_ASSI[i + 1]} />
            ))}
          </div>

          {ascolto && (
            <div style={{ marginTop: "16px", marginBottom: "16px" }}>
              <AscoltoGuidato contenuto={ascolto} />
            </div>
          )}

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
        <p style={{ fontSize: "0.8rem", color: "#999" }}>Le analisi di Liner sono generate con il supporto di Gemini, il modello AI di Google.</p>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .griglia-box {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 0;
        }
        @media (max-width: 640px) {
          .griglia-box {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}