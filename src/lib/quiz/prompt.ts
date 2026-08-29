/** Prompt to paste into NotebookLM so it answers in the syntax the parser expects. */
export const NOTEBOOKLM_PROMPT = `Genera un quiz a risposta multipla basato esclusivamente sulle fonti di questo notebook.
Rispondi SOLO con un blocco Markdown in questo formato esatto, senza testo prima o dopo:

# <tematica> - <capitolo o argomento>
> <una riga di descrizione>

## <domanda>
- [ ] <opzione sbagliata>
- [x] <opzione corretta>
- [ ] <opzione sbagliata>
> <spiegazione esaustiva della risposta corretta>

Regole:
- Il titolo deve dire di cosa parla il test: nome della materia o della tematica, poi il capitolo o l'argomento specifico, separati da un trattino. Per esempio "Diritto privato - Capitolo 4: le obbligazioni" oppure "Storia romana - La crisi della Repubblica". Niente titoli generici come "Quiz" o "Test di verifica".
- La riga di descrizione dice in una frase cosa copre il test.
- Marca sempre con [x] le opzioni corrette e con [ ] quelle sbagliate.
- Se non ti chiedo altrove qualcosa di diverso, ogni domanda ha 4 opzioni e una sola corretta.
- Una domanda può avere più risposte corrette: in quel caso metti più [x]. Non c'è un limite a quante domande possono essere di questo tipo.
- Le opzioni sbagliate devono essere plausibili e pertinenti al contenuto, non assurde: chi non ha studiato deve poterci cadere.
- Le opzioni della stessa domanda devono avere lunghezza e livello di dettaglio simili, altrimenti la corretta si riconosce dalla forma invece che dal contenuto.
- Ordine delle opzioni casuale: la corretta non sempre nella stessa posizione.
- Ogni domanda si regge da sola: nessun riferimento al contesto ("come detto sopra", "nella pagina 3", "secondo l'autore").
- La riga "> spiegazione" è obbligatoria e deve essere esaustiva: perché la risposta corretta è corretta e, dove serve a capire, perché le altre non lo sono. Meglio lunga che vaga.
- Copri punti diversi delle fonti: niente due domande sullo stesso concetto.
- Non inventare niente che non sia nelle fonti.
- Non aggiungere numerazione, titoli di sezione, introduzioni, commenti o note fuori dal formato.`;

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

# Tematica - Capitolo o argomento
> Descrizione in una riga

## Testo della domanda
- [ ] opzione sbagliata
- [x] opzione corretta
- [ ] opzione sbagliata
> Spiegazione esaustiva della risposta corretta

Il titolo deve essere la materia o tematica seguita dal capitolo o argomento, non un generico "Quiz". Marca sempre con [x] le corrette e con [ ] le sbagliate. Più [x] nella stessa domanda significa risposta multipla, senza limiti a quante domande possono esserlo. Se non specifico altrimenti, 4 opzioni per domanda e una sola corretta. Le sbagliate devono essere plausibili e lunghe quanto la corretta. Ordine delle opzioni casuale. La riga > è obbligatoria e deve spiegare per esteso perché la risposta è quella. Niente numerazione, commenti o note fuori dal formato.`;
