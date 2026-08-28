/** Prompt to paste into NotebookLM so it answers in the syntax the parser expects. */
export const NOTEBOOKLM_PROMPT = `Genera un quiz a risposta multipla basato esclusivamente sulle fonti di questo notebook.
Rispondi SOLO con un blocco Markdown in questo formato esatto, senza testo prima o dopo:

# <titolo del quiz>
> <una riga di descrizione>

## <domanda>
- [ ] <opzione sbagliata>
- [x] <opzione corretta>
- [ ] <opzione sbagliata>
> <spiegazione breve della risposta corretta>

Regole:
- 15 domande, ognuna con 4 opzioni.
- Marca con [x] le opzioni corrette e con [ ] quelle sbagliate.
- Se una domanda ha più risposte corrette, metti più [x]: al massimo 3 domande di questo tipo.
- Le opzioni sbagliate devono essere plausibili, non assurde.
- Ordine delle opzioni casuale: la corretta non sempre nella stessa posizione.
- Nessuna domanda che dipenda dal contesto ("come detto sopra", "nella pagina 3").
- Una riga "> spiegazione" per ogni domanda, massimo 200 caratteri.
- Non aggiungere numerazione, commenti o note fuori dal formato.`;

export const SYNTAX_EXAMPLE = `# Titolo del quiz
> Descrizione breve, una riga. Opzionale.

## Qual è la capitale d'Italia?
- [ ] Milano
- [x] Roma
- [ ] Napoli
> Roma è capitale dal 1871. Riga opzionale.

## Quali di questi sono tipizzati staticamente?
Tag: linguaggi
- [x] Rust
- [x] TypeScript
- [ ] Python
> Due [x] significa risposta multipla.`;

/** Compact formatting rules to paste at the end of any NotebookLM prompt. */
export const FORMAT_SNIPPET = `Formatta la risposta esattamente così, senza testo prima o dopo:

# Titolo del quiz
> Descrizione in una riga

## Testo della domanda
- [ ] opzione sbagliata
- [x] opzione corretta
- [ ] opzione sbagliata
> Spiegazione breve della risposta corretta

Marca con [x] le opzioni corrette e con [ ] quelle sbagliate. Più [x] nella stessa domanda significa risposta multipla. Niente numerazione, niente commenti fuori dal formato.`;
