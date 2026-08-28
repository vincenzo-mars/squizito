# Quizzo

Trasforma un blocco di domande generate da NotebookLM in un test con punti, serie e badge.
Frontend statico, nessun backend: quiz e risultati vivono nel `localStorage` del browser.

Live: https://vincenzo-mars.github.io/quizzo/

## Come si usa

1. Copia il prompt qui sotto e dallo in pasto a NotebookLM.
2. Incolla la sua risposta nella home di Quizzo.
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

## Prompt per NotebookLM

```text
Genera un quiz a risposta multipla basato esclusivamente sulle fonti di questo notebook.
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
- Non aggiungere numerazione, commenti o note fuori dal formato.
```

Lo stesso prompt è copiabile dalla home con un bottone.

## Punteggio

100 punti per risposta corretta, moltiplicati per la serie di corrette consecutive
(x1, x1.2, x1.5, x2). Un errore azzera la serie. Niente cronometro.

Modalità **Studio**: correzione e spiegazione subito dopo ogni risposta.
Modalità **Esame**: si risponde a tutte, la correzione arriva alla fine.

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
Il base path arriva dalla variabile `BASE_PATH` (`/quizzo` in CI, vuoto in locale).

Prima del primo deploy: **Settings → Pages → Source: GitHub Actions**.
