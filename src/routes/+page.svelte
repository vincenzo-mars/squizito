<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import Dialog from '$lib/components/Dialog.svelte';
	import QuizCard from '$lib/components/QuizCard.svelte';
	import { DEMO_SOURCE } from '$lib/quiz/demo';
	import { parseQuiz } from '$lib/quiz/parser';
	import { buildPrompt, buildSnippet, SYNTAX_EXAMPLE } from '$lib/quiz/prompt';
	import Toggle from '$lib/components/Toggle.svelte';
	import type { ParseIssue } from '$lib/quiz/types';
	import { downloadBackup, readBackupFile } from '$lib/storage/backup';
	import type { StoredQuiz } from '$lib/storage/types';
	import { library } from '$lib/state/library.svelte';
	import { selection } from '$lib/state/selection.svelte';
	import { settings } from '$lib/state/settings.svelte';
	import { sfx } from '$lib/audio/sfx';

	let ready = $state(false);
	let source = $state('');
	let errors = $state<ParseIssue[]>([]);
	let notice = $state('');
	let pasteOpen = $state(false);
	let guideOpen = $state(false);
	let copied = $state<'' | 'prompt' | 'format'>('');
	let fileInput = $state<HTMLInputElement>();
	let quizInput = $state<HTMLInputElement>();
	let dragging = $state(false);
	let pasteFallback = $state(false);

	/** Guard against someone dropping a whole book: a quiz is a handful of KB. */
	const MAX_FILE_BYTES = 2 * 1024 * 1024;

	const PLACEHOLDER = [
		'# Titolo del quiz',
		'',
		'## Prima domanda?',
		'- [x] Risposta giusta',
		'- [ ] Risposta sbagliata'
	].join('\n');

	let prompt = $derived(buildPrompt(settings.prompt));
	let snippet = $derived(buildSnippet(settings.prompt));

	let renameTarget = $state<StoredQuiz | null>(null);
	let renameValue = $state('');
	let deleteTarget = $state<StoredQuiz | null>(null);

	onMount(() => {
		library.load();
		settings.load();
		sfx.enabled = settings.sound;
		pasteOpen = library.count === 0;
		// First visit: the format is the thing to read before anything else.
		guideOpen = library.count === 0;
		ready = true;
	});

	function load(text: string) {
		errors = [];
		notice = '';

		const result = parseQuiz(text);
		if (!result.ok) {
			errors = result.errors;
			return;
		}

		try {
			const stored = library.save(text, result.quiz);
			selection.select(stored.id);
			goto(resolve('/quiz'));
		} catch (error) {
			notice = error instanceof Error ? error.message : 'Non è stato possibile salvare il quiz.';
		}
	}

	async function loadFile(file: File | undefined) {
		dragging = false;
		if (!file) return;

		if (file.size > MAX_FILE_BYTES) {
			errors = [{ line: 0, message: 'Il file supera i 2 MB: non sembra un quiz.' }];
			return;
		}

		try {
			load(await file.text());
		} catch {
			errors = [{ line: 0, message: 'Non riesco a leggere il file: prova a incollare il testo.' }];
		}
	}

	function onDrop(event: DragEvent) {
		event.preventDefault();
		void loadFile(event.dataTransfer?.files?.[0]);
	}

	function open(quiz: StoredQuiz) {
		selection.select(quiz.id);
		goto(resolve('/quiz'));
	}

	function confirmRename() {
		if (renameTarget) library.rename(renameTarget.id, renameValue);
		renameTarget = null;
	}

	function confirmDelete() {
		if (deleteTarget) library.remove(deleteTarget.id);
		deleteTarget = null;
	}

	async function copy(text: string, which: 'prompt' | 'format') {
		await navigator.clipboard.writeText(text);
		copied = which;
		setTimeout(() => (copied = ''), 2000);
	}

	async function importBackup(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;

		try {
			const merged = library.merge(await readBackupFile(file));
			notice = `Backup importato: ${merged.quizzes} quiz e ${merged.attempts} tentativi aggiunti.`;
		} catch (error) {
			notice = error instanceof Error ? error.message : 'Import non riuscito.';
		}
	}
</script>

<main class="page">
	<section class="hero surface">
		<p class="eyebrow">Quiz da NotebookLM</p>
		<h1>Trasforma i tuoi appunti in un test.</h1>
		<p class="lead muted">
			Fatti generare le domande da NotebookLM nel formato qui sotto, incollale, e Squizito le
			trasforma in un test con punti, serie e badge. Tutto resta nel tuo browser: nessun account,
			nessun server.
		</p>

		<ol class="steps">
			<li><strong>1.</strong> Copia il prompt e dallo in pasto a NotebookLM</li>
			<li><strong>2.</strong> Incolla qui la sua risposta</li>
			<li><strong>3.</strong> Rispondi, accumula punti, riprova le sbagliate</li>
		</ol>
	</section>

	<details class="surface guide" bind:open={guideOpen}>
		<summary>
			<span>Come si scrivono le domande</span>
			<span class="muted summary-hint">formato, prompt per NotebookLM e opzioni</span>
		</summary>

		<div class="stack details-body">
			<p class="muted">
				Il parser è tollerante: numerazione, code fence, grassetto e testo fuori formato non danno
				fastidio. Serve solo che ogni domanda inizi con <code>##</code> e abbia almeno due opzioni,
				di cui almeno una marcata <code>[x]</code>.
			</p>

			<div class="options">
				<p class="eyebrow">Cosa deve generare NotebookLM</p>
				<div class="options-grid">
					<Toggle
						bind:checked={settings.promptMultiple}
						label="Domande a risposta multipla"
						hint="Mescola domande secche e domande con più risposte corrette"
					/>
					<Toggle
						bind:checked={settings.promptTags}
						label="Tag per argomento"
						hint="Una riga Tag: sotto ogni domanda, mostrata sulle card"
					/>
					<Toggle
						bind:checked={settings.promptReasoning}
						label="Domande di ragionamento"
						hint="Casi e conseguenze invece di sole definizioni"
					/>
					<Toggle
						bind:checked={settings.promptMatching}
						label="Collegamenti termine-definizione"
						hint="Esercizi in cui unisci ogni nome alla sua definizione"
					/>
				</div>
			</div>

			<div class="prompt-head">
				<p class="eyebrow">Prompt da dare a NotebookLM</p>
				<Button size="sm" onclick={() => copy(prompt, 'prompt')}>
					{copied === 'prompt' ? 'Copiato' : 'Copia il prompt'}
				</Button>
			</div>
			<pre>{prompt}</pre>

			<p class="muted">Come viene il Markdown che ti restituisce:</p>
			<pre>{SYNTAX_EXAMPLE}</pre>
		</div>
	</details>

	{#if ready && library.count > 0}
		<section class="stack">
			<div class="row">
				<h2>La tua libreria</h2>
				<span class="muted">
					{library.count}
					{library.count === 1 ? 'quiz salvato' : 'quiz salvati'}
				</span>
				<div class="spacer"></div>
				<Button variant="blue" size="sm" onclick={() => (pasteOpen = !pasteOpen)}>
					{pasteOpen ? 'Chiudi' : 'Carica nuovo quiz'}
				</Button>
			</div>

			<div class="grid">
				{#each library.quizzes as quiz (quiz.id)}
					<QuizCard
						{quiz}
						best={library.best(quiz.id)}
						last={library.last(quiz.id)}
						onopen={() => open(quiz)}
						onrename={() => {
							renameTarget = quiz;
							renameValue = quiz.title;
						}}
						ondelete={() => (deleteTarget = quiz)}
					/>
				{/each}
			</div>
		</section>
	{/if}

	{#if pasteOpen || !ready || library.count === 0}
		<section class="surface stack">
			<h2>Carica il quiz</h2>

			<button
				type="button"
				class="drop"
				class:dragging
				onclick={() => quizInput?.click()}
				ondragover={(event) => {
					event.preventDefault();
					dragging = true;
				}}
				ondragleave={() => (dragging = false)}
				ondrop={onDrop}
			>
				<span class="drop-icon" aria-hidden="true">📄</span>
				<span class="drop-title">Trascina qui il file .md</span>
				<span class="drop-hint muted">
					quello che NotebookLM salva fra le fonti, oppure scegline uno dal disco
				</span>
			</button>

			<input
				bind:this={quizInput}
				class="sr-only"
				type="file"
				accept=".md,.markdown,.txt,text/markdown,text/plain"
				onchange={(event) => {
					const input = event.currentTarget;
					const file = input.files?.[0];
					input.value = '';
					void loadFile(file);
				}}
			/>

			{#if pasteFallback}
				<textarea bind:value={source} rows="10" spellcheck="false" placeholder={PLACEHOLDER}
				></textarea>
			{:else}
				<button class="link" onclick={() => (pasteFallback = true)}>
					oppure incolla il testo a mano
				</button>
			{/if}

			{#if errors.length}
				<div class="errors">
					<strong>Il formato non torna:</strong>
					<ul>
						{#each errors as issue, i (i)}
							<li>{issue.line ? `Riga ${issue.line}: ` : ''}{issue.message}</li>
						{/each}
					</ul>
				</div>
			{/if}

			<div class="row">
				{#if pasteFallback}
					<Button onclick={() => load(source)} disabled={!source.trim()}>Carica quiz</Button>
				{/if}
				<Button variant="ghost" onclick={() => load(DEMO_SOURCE)}>Prova il quiz demo</Button>
			</div>

			<aside class="snippet">
				<div class="snippet-head">
					<p class="eyebrow">Da aggiungere al prompt di NotebookLM</p>
					<Button variant="blue" size="sm" onclick={() => copy(snippet, 'format')}>
						{copied === 'format' ? 'Copiato' : 'Copia'}
					</Button>
				</div>
				<pre>{snippet}</pre>
				<p class="muted snippet-note">
					Versione corta, da incollare in coda a una richiesta che hai già scritto. Segue le stesse
					opzioni scelte qui sopra.
				</p>
			</aside>
		</section>
	{/if}

	{#if ready}
		<section class="row backup">
			<span class="muted">
				I quiz e i risultati stanno solo su questo browser: esporta un backup se ci tieni.
			</span>
			<div class="spacer"></div>
			<Button variant="ghost" size="sm" onclick={() => downloadBackup(library.toBackup())}>
				Esporta backup
			</Button>
			<Button variant="ghost" size="sm" onclick={() => fileInput?.click()}>Importa backup</Button>
			<input
				bind:this={fileInput}
				class="sr-only"
				type="file"
				accept="application/json"
				onchange={importBackup}
			/>
		</section>
	{/if}

	{#if notice}
		<p class="notice">{notice}</p>
	{/if}
</main>

<Dialog open={renameTarget !== null} title="Rinomina quiz" onclose={() => (renameTarget = null)}>
	<label class="field">
		<span>Titolo</span>
		<input bind:value={renameValue} />
	</label>
	{#snippet actions()}
		<Button variant="ghost" size="sm" onclick={() => (renameTarget = null)}>Annulla</Button>
		<Button size="sm" onclick={confirmRename}>Salva</Button>
	{/snippet}
</Dialog>

<Dialog
	open={deleteTarget !== null}
	title="Eliminare il quiz?"
	onclose={() => (deleteTarget = null)}
>
	<p class="muted">
		"{deleteTarget?.title}" e i suoi {deleteTarget?.attempts.length} tentativi vengono cancellati da questo
		browser. L'operazione non si annulla.
	</p>
	{#snippet actions()}
		<Button variant="ghost" size="sm" onclick={() => (deleteTarget = null)}>Annulla</Button>
		<Button variant="danger" size="sm" onclick={confirmDelete}>Elimina</Button>
	{/snippet}
</Dialog>

<style>
	.hero {
		display: grid;
		gap: 1rem;
	}

	h1 {
		font-size: clamp(1.9rem, 5vw, 2.8rem);
	}

	.lead {
		max-width: 62ch;
	}

	.steps {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin: 0.5rem 0 0;
		padding: 0;
	}

	.steps li {
		background: var(--bg-tint);
		border-radius: 999px;
		padding: 0.4rem 0.9rem;
		font-size: 0.88rem;
		font-weight: 700;
		color: var(--ink-soft);
	}

	.steps strong {
		color: var(--orange-dark);
	}

	h2 {
		font-size: 1.35rem;
	}

	.spacer {
		flex: 1;
	}

	.grid {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	}

	textarea,
	.field input {
		width: 100%;
		font-family: ui-monospace, 'SF Mono', Menlo, monospace;
		font-size: 0.9rem;
		line-height: 1.55;
		padding: 0.9rem 1rem;
		border-radius: var(--radius);
		border: 2px solid var(--line);
		background: #fbfdff;
		color: var(--ink);
		resize: vertical;
	}

	.field {
		display: grid;
		gap: 0.35rem;
		font-weight: 700;
	}

	.field input {
		font-family: var(--font);
		font-size: 1rem;
	}

	textarea:focus-visible,
	.field input:focus-visible {
		outline: 3px solid var(--blue);
		outline-offset: 1px;
		border-color: var(--blue);
	}

	.drop {
		display: grid;
		justify-items: center;
		gap: 0.35rem;
		width: 100%;
		padding: clamp(1.5rem, 5vw, 2.5rem) 1.25rem;
		border: 3px dashed var(--line-strong);
		border-radius: var(--radius-lg);
		background: var(--bg-tint);
		color: var(--ink);
		cursor: pointer;
		text-align: center;
		transition:
			border-color var(--speed) var(--ease),
			background var(--speed) var(--ease),
			transform var(--speed) var(--ease);
	}

	.drop:hover,
	.drop.dragging {
		border-color: var(--orange);
		background: var(--orange-soft);
		transform: translateY(-2px);
	}

	.drop-icon {
		font-size: 2rem;
		line-height: 1;
	}

	.drop-title {
		font-weight: 800;
		font-size: 1.05rem;
	}

	.drop-hint {
		font-size: 0.85rem;
		max-width: 34ch;
	}

	.link {
		justify-self: center;
		border: none;
		background: none;
		padding: 0;
		font-size: 0.88rem;
		font-weight: 700;
		color: var(--orange-dark);
		text-decoration: underline;
		cursor: pointer;
	}

	.errors {
		background: var(--red-soft);
		border: 2px solid var(--red);
		border-radius: var(--radius);
		padding: 0.9rem 1.1rem;
		font-size: 0.9rem;
	}

	.errors ul {
		margin: 0.5rem 0 0;
		padding-left: 1.1rem;
	}

	summary {
		cursor: pointer;
		font-weight: 800;
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.5rem;
	}

	.summary-hint {
		font-weight: 700;
		font-size: 0.82rem;
	}

	.guide {
		border-color: var(--orange);
		background: linear-gradient(var(--orange-soft), var(--surface) 120px);
	}

	.options {
		display: grid;
		gap: 0.6rem;
		padding: 0.9rem 1rem;
		border: 2px solid var(--line);
		border-radius: var(--radius);
		background: var(--surface);
	}

	.options-grid {
		display: grid;
		gap: 0.25rem;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
	}

	.prompt-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.prompt-head :global(.btn) {
		flex: none;
		white-space: nowrap;
	}

	.details-body {
		margin-top: 1rem;
	}

	/* The prompt is long prose: wrap it instead of forcing a horizontal scroll. */
	.guide pre {
		white-space: pre-wrap;
		max-height: 340px;
		overflow: auto;
	}

	pre {
		margin: 0;
		overflow-x: auto;
		background: var(--bg-tint);
		border-radius: var(--radius);
		padding: 1rem;
		font-size: 0.82rem;
		line-height: 1.5;
	}

	code {
		background: var(--bg-tint);
		border-radius: 6px;
		padding: 0.05rem 0.3rem;
		font-size: 0.85em;
	}

	.snippet {
		display: grid;
		gap: 0.6rem;
		padding: 0.9rem 1rem;
		border: 2px dashed var(--line-strong);
		border-radius: var(--radius);
		background: var(--blue-soft);
	}

	.snippet-head {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75rem;
		justify-content: space-between;
	}

	.snippet-head :global(.btn) {
		flex: none;
		white-space: nowrap;
	}

	.snippet pre {
		background: rgb(255 255 255 / 0.7);
		font-size: 0.78rem;
		padding: 0.85rem;
		max-height: 220px;
		overflow: auto;
		white-space: pre-wrap;
	}

	.snippet-note {
		font-size: 0.82rem;
	}

	.backup {
		font-size: 0.85rem;
	}

	.notice {
		background: var(--blue-soft);
		border: 2px solid var(--blue);
		border-radius: var(--radius);
		padding: 0.8rem 1rem;
		font-weight: 700;
	}
</style>
