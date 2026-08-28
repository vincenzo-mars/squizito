<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import QuestionCard from '$lib/components/QuestionCard.svelte';
	import Toggle from '$lib/components/Toggle.svelte';
	import { formatDate, percentage } from '$lib/format';
	import { parseQuiz } from '$lib/quiz/parser';
	import type { Quiz } from '$lib/quiz/types';
	import type { StoredQuiz } from '$lib/storage/types';
	import { library } from '$lib/state/library.svelte';
	import { run } from '$lib/state/run.svelte';
	import { selection } from '$lib/state/selection.svelte';
	import { settings } from '$lib/state/settings.svelte';
	import { sfx } from '$lib/audio/sfx';

	let ready = $state(false);
	let stored = $state<StoredQuiz | null>(null);
	let quiz = $state<Quiz | null>(null);
	let problem = $state('');

	let best = $derived(stored ? library.best(stored.id) : undefined);

	onMount(() => {
		library.load();
		settings.load();
		selection.load();

		const entry = selection.id ? library.find(selection.id) : undefined;
		if (!entry) {
			goto(resolve('/'));
			return;
		}

		const parsed = parseQuiz(entry.source);
		if (!parsed.ok) {
			problem = parsed.errors[0]?.message ?? 'Il quiz salvato non è più leggibile.';
		} else {
			quiz = parsed.quiz;
		}

		stored = entry;
		ready = true;
	});

	$effect(() => {
		sfx.enabled = settings.sound;
	});

	function setMode(mode: 'study' | 'exam') {
		settings.mode = mode;
	}

	function start() {
		if (!stored || !quiz) return;
		run.start(stored, quiz, {
			mode: settings.mode,
			autoAdvance: settings.autoAdvance,
			shuffle: settings.shuffle
		});
		sfx.select();
		goto(resolve('/test'));
	}
</script>

<main class="page">
	{#if ready && stored}
		<section class="surface head">
			<p class="eyebrow">Quiz caricato</p>
			<h1>{stored.title}</h1>
			{#if quiz?.description}
				<p class="muted lead">{quiz.description}</p>
			{/if}

			<div class="pills">
				<span class="pill">{quiz?.questions.length ?? 0} domande</span>
				<span class="pill">{stored.attempts.length} tentativi</span>
				{#if best}
					<span class="pill gold">
						Record {best.score} pt · {percentage(best.correct, best.total)}% · {formatDate(best.at)}
					</span>
				{/if}
			</div>
		</section>

		{#if problem}
			<section class="surface stack">
				<h2>Questo quiz non si apre</h2>
				<p class="muted">{problem}</p>
				<div class="row">
					<Button variant="ghost" href={resolve('/')}>Torna alla libreria</Button>
				</div>
			</section>
		{:else if quiz}
			<section class="surface stack">
				<h2>Come vuoi giocare</h2>

				<div class="segmented" role="group" aria-label="Modalità">
					<button
						class="segment"
						class:active={settings.mode === 'study'}
						onclick={() => setMode('study')}
					>
						<strong>Studio</strong>
						<span>Ti dico subito se è giusta, con la spiegazione</span>
					</button>
					<button
						class="segment"
						class:active={settings.mode === 'exam'}
						onclick={() => setMode('exam')}
					>
						<strong>Esame</strong>
						<span>Rispondi a tutte, correzione solo alla fine</span>
					</button>
				</div>

				<div class="toggles">
					<Toggle
						bind:checked={settings.autoAdvance}
						label="Avanzamento automatico"
						hint="Passa alla domanda dopo da solo"
					/>
					<Toggle
						bind:checked={settings.shuffle}
						label="Mescola"
						hint="Ordine casuale di domande e opzioni"
					/>
					<Toggle bind:checked={settings.sound} label="Audio" hint="Suoni su risposte e serie" />
				</div>

				<Button size="lg" onclick={start} full>Inizia test</Button>
			</section>

			<section class="stack">
				<div class="row">
					<h2>Le domande</h2>
					<span class="muted">Le risposte restano nascoste, tranquillo</span>
				</div>
				<div class="questions">
					{#each quiz.questions as question, index (index)}
						<QuestionCard {question} number={index + 1} />
					{/each}
				</div>
			</section>
		{/if}
	{/if}
</main>

<style>
	.head {
		display: grid;
		gap: 0.75rem;
	}

	h1 {
		font-size: clamp(1.6rem, 4vw, 2.3rem);
	}

	h2 {
		font-size: 1.25rem;
	}

	.lead {
		max-width: 62ch;
	}

	.pills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.pill {
		font-size: 0.78rem;
		font-weight: 800;
		padding: 0.25rem 0.7rem;
		border-radius: 999px;
		background: var(--bg-tint);
		color: var(--ink-soft);
	}

	.gold {
		background: var(--yellow);
		color: #4a3800;
	}

	.segmented {
		display: grid;
		gap: 0.75rem;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	}

	.segment {
		display: grid;
		gap: 0.2rem;
		text-align: left;
		padding: 0.9rem 1.1rem;
		border-radius: var(--radius);
		border: 2px solid var(--line);
		background: var(--surface);
		box-shadow: 0 var(--depth) 0 var(--line-strong);
		cursor: pointer;
		color: var(--ink-soft);
		transition:
			transform var(--speed) var(--ease),
			border-color var(--speed) var(--ease),
			background var(--speed) var(--ease);
	}

	.segment strong {
		color: var(--ink);
		font-size: 1.05rem;
	}

	.segment span {
		font-size: 0.85rem;
	}

	.segment:hover {
		transform: translateY(-2px);
	}

	.segment.active {
		background: var(--green-soft);
		border-color: var(--green);
		box-shadow: 0 var(--depth) 0 var(--green-dark);
	}

	.toggles {
		display: grid;
		gap: 0.25rem;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
	}

	.questions {
		display: grid;
		gap: 0.75rem;
	}
</style>
