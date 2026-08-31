# Squizito

Trasforma un blocco di domande generate da NotebookLM in un test con punti, serie e badge.
Frontend statico, nessun backend: quiz e risultati vivono nel `localStorage` del browser.

Live: https://vincenzo-mars.github.io/squizito/

## Come si usa

1. Copia il prompt qui sotto e dallo in pasto a NotebookLM.
2. Incolla la sua risposta nella home di Squizito.
3. Rispondi, accumula punti, riprova le sbagliate.

## Sintassi delle domande

```markdown
# Titolo del quiz

> Descrizione breve, una riga. Opzionale.

## Qual è la capitale d'Italia?

- Milano
- Roma
- Napoli

> Corretta: "Roma". Roma è capitale dal 1871. La spiegazione è mostrata dopo la risposta.

## Quali di questi sono tipizzati staticamente?

Tag: linguaggi

- Rust
- TypeScript
- Python

> Corrette: "Rust"; "TypeScript". Due risposte citate significano risposta multipla: per il punto le devi prendere tutte.
```

| Elemento                        | Regola                                                                                 |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| `# Titolo`                      | opzionale, una sola volta                                                              |
| `>` subito dopo il titolo       | descrizione del quiz                                                                   |
| `## Domanda`                    | inizia una domanda, la numerazione iniziale viene rimossa                              |
| `- opzione`                     | una opzione, accetta `*`, `+`, `•`, `–` e `—` al posto del trattino                    |
| `> Corretta: "..."`             | dichiara la risposta: il testo fra virgolette deve essere identico a una delle opzioni |
| `> Corrette: "..."; "..."`      | risposta multipla, elenca tutti i testi corretti                                       |
| `>` dopo la citazione           | spiegazione, opzionale, va dopo la citazione o su una riga a parte                     |
| `Tag: ...`                      | opzionale, raggruppa le card                                                           |
| `---`, righe vuote, altro testo | ignorati                                                                               |

Vincoli: almeno 2 opzioni per domanda, ogni domanda a scelta deve avere la riga
`Corretta:`/`Corrette:`, i testi citati devono combaciare con le opzioni, le opzioni devono essere
tutte diverse fra loro, e almeno una deve restare non citata. Gli errori di formato indicano riga
e motivo.

### Collegamenti termine-definizione

Un blocco `##` le cui righe hanno la forma `- nome -> definizione`, senza la riga `Corretta:`,
diventa un esercizio di collegamento: l'app mescola le due colonne e le si riunisce a mano.

```markdown
## Collega ogni processo alla sua descrizione

- Mitosi -> Divisione cellulare che produce due cellule identiche
- Meiosi -> Divisione che dimezza il corredo cromosomico
- Apoptosi -> Morte cellulare programmata

> Sono tre processi distinti.
```

Da 2 a 8 coppie, `→` e `=>` valgono come `->`, e un blocco non può mescolare coppie e opzioni. Un
collegamento non ha mai la riga `Corretta:`: se c'è, il blocco viene letto come domanda a scelta.
Il punteggio è tutto o niente, come per le domande a risposta multipla.

## Prompt per NotebookLM

```text
Genera un quiz di ripasso dalle fonti accademiche di questo notebook.
Lavora su tutte le fonti del notebook.

Salvalo fra le NOTE del notebook, mai fra le fonti: una nuova nota intitolata "<materia o fonte> - <capitolo o argomento> COMPLETO" che contenga solo il quiz, e rispondi in chat con lo stesso identico contenuto, senza testo prima o dopo.

# <materia o fonte> - <capitolo o argomento>
> <una riga su cosa copre>

## <domanda>
- <opzione>
- <opzione>
- <opzione>
- <opzione>
> Corretta: "<testo identico dell'opzione corretta>". <spiegazione esaustiva>

## <domanda con più risposte corrette>
- <opzione>
- <opzione>
- <opzione>
- <opzione>
> Corrette: "<testo identico della prima opzione corretta>"; "<testo identico della seconda>". <spiegazione esaustiva>

Regole:
- 4 opzioni per domanda. Alterna domande con una sola risposta corretta e domande con più risposte corrette, queste ultime in minoranza e senza dire nel testo della domanda quante siano.
- Le opzioni sono trattini semplici: niente caselle [ ] o [x], niente lettere o numeri davanti, niente grassetto sul testo.
- Metti sempre la risposta corretta come PRIMA opzione. Non mescolare le opzioni: al mescolamento pensa l'app.
- Distrattori plausibili e lunghi quanto la corretta.
- Le opzioni di una stessa domanda devono essere tutte diverse fra loro: mai due opzioni con lo stesso testo.
- Niente domande con negazione ("quale NON è", "quale è falso"). Niente opzioni "tutte le precedenti" o "nessuna delle precedenti".
- Ogni domanda si regge da sola: niente rimandi a pagine, paragrafi o "come sopra".
- Subito dopo le opzioni, una riga "> " dichiara la risposta: > Corretta: "<testo copiato alla lettera dall'opzione giusta>". Poi spiega perché è corretta e, se serve, perché le altre no.
- Se le risposte corrette sono più di una, la riga diventa: > Corrette: "<testo della prima>"; "<testo della seconda>". Elencale tutte, ognuna fra virgolette, separate da punto e virgola.
- Il testo fra virgolette deve essere identico all'opzione, carattere per carattere: è l'unico modo che l'app ha di sapere qual è la risposta giusta. Se manca la riga, o se il testo non combacia con nessuna opzione, il quiz non si carica.
- Copri punti diversi, non ripetere lo stesso concetto, non uscire dalle fonti.
- Solo il formato: niente numerazione, introduzioni, commenti o note.
```

Il prompt si costruisce dalla home: tre campi per il nome della fonte, il capitolo e quante domande
generare, quattro interruttori per risposta multipla, tag, domande di ragionamento e collegamenti.
Lasciando i campi vuoti il quiz copre tutte le fonti del notebook. Il bottone lo copia già
assemblato.

Il quiz finisce fra le **note** del notebook, mai fra le fonti: così non rientra nelle fonti da cui
NotebookLM genera le domande successive. Oltre le 15 domande il prompt passa a blocchi cumulativi,
perché una risposta sola verrebbe troncata: a ogni blocco si risponde `continua`, e la nota da
caricare è solo l'ultima, quella che finisce per `COMPLETO`. Un capitolo scritto come numero secco
viene esteso in `CAPITOLO <n>`, così il titolo della nota resta riconoscibile nel notebook.

## Punteggio

100 punti per risposta corretta, moltiplicati per la serie di corrette consecutive
(x1, x1.2, x1.5, x2). Un errore azzera la serie. Niente cronometro.

Modalità **Studio**: correzione e spiegazione subito dopo ogni risposta.
Modalità **Esame**: si risponde a tutte, la correzione arriva alla fine.

## Ripasso

Ogni domanda di ogni test ha una sua scheda di ripetizione dilazionata, con un SM-2 semplificato:

- risposta giusta: la domanda si allontana (1 giorno, 3 giorni, poi intervallo × ease, ease 1.3-2.8);
- risposta sbagliata: torna a oggi, l'ease scende di 0.2 e il contatore delle cadute sale.

Il ripasso è **per singolo test**, non trasversale alla libreria: lo trovi nella pagina del quiz,
con la padronanza complessiva, quante domande sono da rivedere e il bottone che costruisce una
sessione con le più deboli (sbagliate, mai viste, poi le meno solide).

Non c'è nessun cancello temporale: puoi ripetere lo stesso test quante volte vuoi, anche più volte
nello stesso giorno, e ogni risposta aggiorna la scheda. L'unica cosa che richiede che la domanda
sia effettivamente scaduta è l'allungamento dell'intervallo, altrimenti rispondere in anticipo
gonfierebbe il calendario senza un vero sforzo di richiamo dietro.

L'identità di una domanda è l'hash del suo testo normalizzato, quindi ricaricare lo stesso quiz
non azzera la storia.

## Dati

Quiz, tentativi ed errori stanno solo nel browser che li ha creati: nessun account, nessuna
sincronizzazione. La home ha export e import di un backup `.json` per spostarli o non perderli.

## Sviluppo

```bash
npm install
npm run dev
```

| Comando          | Cosa fa                   |
| ---------------- | ------------------------- |
| `npm run dev`    | dev server                |
| `npm run check`  | svelte-check              |
| `npm run lint`   | prettier --check + eslint |
| `npm run format` | prettier --write          |
| `npm test`       | vitest (unit sul parser)  |
| `npm run build`  | build statica in `build/` |

## Deploy

`.github/workflows/deploy.yml` builda e pubblica su GitHub Pages a ogni push su `main`.
Il base path arriva dalla variabile `BASE_PATH` (`/squizito` in CI, vuoto in locale).

Prima del primo deploy: **Settings → Pages → Source: GitHub Actions**.
