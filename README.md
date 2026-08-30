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

- [ ] Milano
- [x] Roma
- [ ] Napoli

> Roma è capitale dal 1871. Riga opzionale, mostrata dopo la risposta.

## Quali di questi sono tipizzati staticamente?

Tag: linguaggi

- [x] Rust
- [x] TypeScript
- [ ] Python

> Due `[x]` significa risposta multipla: per il punto le devi prendere tutte.
```

| Elemento                        | Regola                                                                      |
| ------------------------------- | --------------------------------------------------------------------------- |
| `# Titolo`                      | opzionale, una sola volta                                                   |
| `>` subito dopo il titolo       | descrizione del quiz                                                        |
| `## Domanda`                    | inizia una domanda, la numerazione iniziale viene rimossa                   |
| `- [x]` / `- [ ]`               | opzione giusta / sbagliata, accetta `[X]`, `*` al posto di `-`, spazi extra |
| più di una `[x]`                | domanda a risposta multipla                                                 |
| `>` dopo le opzioni             | spiegazione, opzionale                                                      |
| `Tag: ...`                      | opzionale, raggruppa le card                                                |
| `---`, righe vuote, altro testo | ignorati                                                                    |

Vincoli: almeno 2 opzioni per domanda, almeno una corretta e almeno una sbagliata. Gli errori di
formato indicano riga e motivo.

### Collegamenti termine-definizione

Un blocco `##` le cui righe hanno la forma `- nome -> definizione`, senza `[ ]`, diventa un
esercizio di collegamento: l'app mescola le due colonne e le si riunisce a mano.

```markdown
## Collega ogni processo alla sua descrizione

- Mitosi -> Divisione cellulare che produce due cellule identiche
- Meiosi -> Divisione che dimezza il corredo cromosomico
- Apoptosi -> Morte cellulare programmata

> Sono tre processi distinti.
```

Da 2 a 8 coppie, `→` e `=>` valgono come `->`, e un blocco non può mescolare coppie e opzioni `[x]`.
Il punteggio è tutto o niente, come per le domande a risposta multipla.

## Prompt per NotebookLM

```text
Genera un quiz di ripasso dalle fonti accademiche di questo notebook.
Lavora su tutte le fonti del notebook.

Salvalo come nuova fonte del notebook, in un file "<materia o fonte> - <capitolo o argomento>.md" che contenga solo il quiz, e rispondi in chat con lo stesso identico contenuto, senza testo prima o dopo.

# <materia o fonte> - <capitolo o argomento>
> <una riga su cosa copre>

## <domanda>
- [ ] <opzione sbagliata>
- [x] <opzione corretta>
- [ ] <opzione sbagliata>
> <spiegazione esaustiva>

Regole:
- 4 opzioni per domanda. Alterna domande con una sola [x] e domande con più [x], queste ultime in minoranza e senza dire quante siano le corrette.
- Distrattori plausibili, lunghi quanto la corretta, in ordine casuale.
- Ogni domanda si regge da sola: niente rimandi a pagine, paragrafi o "come sopra".
- La riga "> " è obbligatoria: perché la corretta è corretta e, se serve, perché le altre no.
- Copri punti diversi, non ripetere lo stesso concetto, non uscire dalle fonti.
- Solo il formato: niente numerazione, introduzioni, commenti o note.
```

Il prompt si costruisce dalla home: due campi per il nome della fonte e per il capitolo, quattro
interruttori per risposta multipla, tag, domande di ragionamento e collegamenti. Lasciando i campi
vuoti il quiz copre tutte le fonti del notebook. Il bottone lo copia già assemblato.

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
