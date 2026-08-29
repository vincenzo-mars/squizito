<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import BadgeChip from '$lib/components/BadgeChip.svelte';
	import Button from '$lib/components/Button.svelte';
	import Confetti from '$lib/components/Confetti.svelte';
	import { formatDuration, percentage } from '$lib/format';
	import type { Badge } from '$lib/quiz/badges';
	import type { Level } from '$lib/quiz/levels';
	import { maxScore } from '$lib/quiz/scoring';
	import { describeDue } from '$lib/review/schedule';
	import { library } from '$lib/state/library.svelte';
	import { run } from '$lib/state/run.svelte';
	import { settings } from '$lib/state/settings.svelte';
	import { sfx } from '$lib/audio/sfx';

	let ready = $state(false);
	let now = $state(Date.now());
	let badges = $state<Badge[]>([]);
	let previousBest = $state<number | null>(null);
	let leveledUp = $state(false);
	let newLevel = $state<Level | null>(null);

	let correct = $derived(run.correctCount);
	let total = $derived(run.total);
	let score = $derived(run.score);
	let ratio = $derived(percentage(correct, total));
	let attempt = $derived(run.attempt);
	let wrong = $derived(run.entries.filter((entry) => !entry.correct));
	let stored = $derived(run.quizId ? library.find(run.quizId) : undefined);

	/** How the answers just given moved the review schedule of each question. */
	let schedule = $derived.by(() => {
		const quizId = run.quizId;
		if (!quizId || !ready) return [];

		const buckets: { label: string; count: number; due: number }[] = [];
		for (const entry of run.entries) {
			const question = run.questionAt(entry);
			if (!question) continue;
			const state = library.stateFor(quizId, question);
			if (!state) continue;

			const label = describeDue(state.due, now);
			const bucket = buckets.find((item) => item.label === label);
			if (bucket) bucket.count += 1;
			else buckets.push({ label, count: 1, due: state.due });
		}

		return buckets.sort((a, b) => a.due - b.due);
	});

	onMount(() => {
		settings.load();
		sfx.enabled = settings.sound;

		if (!run.restore()) {
			goto(resolve('/'));
			return;
		}

		const quizId = run.quizId;
		const earlier = quizId
			? (library
					.find(quizId)
					?.attempts.filter((item) => !item.partial && item.id !== run.data?.attemptId)
					.map((item) => item.score) ?? [])
			: [];
		previousBest = earlier.length ? Math.max(...earlier) : null;

		const result = run.finish();
		badges = result.badges;
		leveledUp = result.leveledUp;
		newLevel = result.newLevel;
		ready = true;
		sfx.finish(ratio >= 60);
	});

	function retryWrong() {
		const indexes = run.wrongIndexes;
		const quiz = run.quiz;
		if (!stored || !quiz || !indexes.length) return;

		run.start(
			stored,
			quiz,
			{ mode: settings.mode, autoAdvance: settings.autoAdvance, shuffle: settings.shuffle },
			indexes
		);
		goto(resolve('/test'));
	}

	function retryAll() {
		const quiz = run.quiz;
		if (!stored || !quiz) return;

		run.start(stored, quiz, {
			mode: settings.mode,
			autoAdvance: settings.autoAdvance,
			shuffle: settings.shuffle
		});
		goto(resolve('/test'));
	}

	function backToLibrary() {
		run.reset();
		goto(resolve('/'));
	}
</script>

{#if ready && ratio >= 60}
	<Confetti />
{/if}

<main class="page">
	{#if ready}
		<section class="surface summary">
			<p class="eyebrow">{run.partial ? 'Ripasso degli errori' : 'Test completato'}</p>
			<h1>{stored?.title ?? 'Quiz'}</h1>

			<div class="score">
				<span class="value">{score}</span>
				<span class="unit">punti su {maxScore(total)}</span>
			</div>

			<div class="stats">
				<div class="stat">
					<span class="n">{correct}/{total}</span>
					<span class="l">risposte giuste</span>
				</div>
				<div class="stat">
					<span class="n">{ratio}%</span>
					<span class="l">di precisione</span>
				</div>
				<div class="stat">
					<span class="n">{run.bestStreak}</span>
					<span class="l">serie migliore</span>
				</div>
				{#if attempt}
					<div class="stat">
						<span class="n">{formatDuration(attempt.durationMs)}</span>
						<span class="l">tempo impiegato</span>
					</div>
				{/if}
			</div>

			{#if leveledUp && newLevel}
				<div class="levelup-banner" role="status" aria-live="polite">
					<span class="levelup-emoji">{newLevel.emoji}</span>
					<span class="levelup-text">
						Livello {newLevel.number} raggiunto: <strong>{newLevel.name}</strong>
					</span>
				</div>
			{/if}

			{#if run.partial}
				<p class="muted note">
					Questo era un ripasso delle sole domande sbagliate: non conta per il record.
				</p>
			{:else if previousBest === null}
				<p class="muted note">
					Primo tentativo su questo quiz: da qui in poi c'è un record da battere.
				</p>
			{:else if score > previousBest}
				<p class="record">Nuovo record: {score - previousBest} punti meglio di prima.</p>
			{:else}
				<p class="muted note">Il tuo record resta {previousBest} punti.</p>
			{/if}
		</section>

		{#if badges.length}
			<section class="stack">
				<h2>Badge sbloccati</h2>
				<div class="badges">
					{#each badges as badge, index (badge.id)}
						<BadgeChip {badge} delay={index * 120} />
					{/each}
				</div>
			</section>
		{/if}

		{#if schedule.length}
			<section class="stack">
				<h2>Quando le rivedi</h2>
				<div class="pills">
					{#each schedule as bucket (bucket.label)}
						<span class="pill" class:today={bucket.label === 'oggi'}>
							{bucket.count}
							{bucket.count === 1 ? 'domanda' : 'domande'}
							{bucket.label}
						</span>
					{/each}
				</div>
				<p class="muted note-left">
					Le sbagliate tornano subito in coda di ripasso, le altre si allontanano man mano che le
					azzecchi. Trovi il ripasso nella pagina del quiz.
				</p>
			</section>
		{/if}

		{#if wrong.length}
			<section class="stack">
				<h2>Cosa è andato storto</h2>
				{#each wrong as entry (entry.index)}
					{@const question = run.questionAt(entry)}
					{#if question}
						<article class="wrong surface">
							<p class="q">{question.text}</p>
							{#if question.kind === 'match'}
								<ul class="pairs">
									{#each question.pairs as pair, index (index)}
										<li class:missed={entry.links[index] !== index}>
											<strong>{pair.name}</strong>
											<span>{pair.definition}</span>
										</li>
									{/each}
								</ul>
							{:else}
								<p class="line bad">
									<span class="key">La tua risposta</span>
									<span class="val">
										{entry.selected.length
											? entry.selected.map((i) => question.options[i].text).join(', ')
											: 'nessuna'}
									</span>
								</p>
								<p class="line good">
									<span class="key">Corretta</span>
									<span class="val">
										{question.options
											.filter((option) => option.correct)
											.map((option) => option.text)
											.join(', ')}
									</span>
								</p>
							{/if}
							{#if question.explanation}
								<p class="muted explain">{question.explanation}</p>
							{/if}
						</article>
					{/if}
				{/each}
			</section>
		{/if}

		<section class="row actions">
			{#if wrong.length}
				<Button onclick={retryWrong}>
					{wrong.length === 1
						? 'Riprova la domanda sbagliata'
						: `Riprova le ${wrong.length} sbagliate`}
				</Button>
			{/if}
			<Button variant="blue" onclick={retryAll}>Rifai tutto il test</Button>
			<Button variant="ghost" onclick={backToLibrary}>Torna alla libreria</Button>
		</section>
	{/if}
</main>

<style>
	.summary {
		display: grid;
		gap: 1rem;
		text-align: center;
		justify-items: center;
	}

	h1 {
		font-size: clamp(1.5rem, 4vw, 2.2rem);
	}

	h2 {
		font-size: 1.25rem;
	}

	.score {
		display: grid;
		justify-items: center;
		gap: 0.15rem;
		padding: 0.5rem 2rem;
		border-radius: var(--radius-lg);
		background: var(--green-soft);
		border: 2px solid var(--green);
		animation: pop 500ms var(--ease);
	}

	.value {
		font-size: clamp(2.8rem, 9vw, 4.2rem);
		font-weight: 900;
		line-height: 1;
		color: var(--green-dark);
	}

	.unit {
		font-weight: 700;
		color: var(--ink-soft);
		font-size: 0.9rem;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 0.75rem;
		width: 100%;
	}

	.stat {
		display: grid;
		gap: 0.1rem;
		padding: 0.75rem;
		border-radius: var(--radius);
		background: var(--bg-tint);
	}

	.n {
		font-size: 1.35rem;
		font-weight: 900;
	}

	.l {
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--ink-soft);
	}

	.note {
		font-size: 0.9rem;
	}

	.record {
		font-weight: 800;
		color: var(--green-dark);
		background: var(--green-soft);
		border-radius: 999px;
		padding: 0.35rem 1rem;
	}

	.pills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.pill {
		font-size: 0.82rem;
		font-weight: 800;
		padding: 0.25rem 0.7rem;
		border-radius: 999px;
		background: var(--bg-tint);
		color: var(--ink-soft);
	}

	.pill.today {
		background: var(--orange-soft);
		color: var(--orange-dark);
	}

	.note-left {
		font-size: 0.85rem;
	}

	.badges {
		display: grid;
		gap: 0.6rem;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
	}

	.wrong {
		display: grid;
		gap: 0.4rem;
		padding: 1rem 1.15rem;
		border-radius: var(--radius);
	}

	.q {
		font-weight: 800;
		line-height: 1.5;
		max-width: var(--reading);
	}

	.line {
		font-size: 0.92rem;
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 0.4rem;
		line-height: 1.5;
	}

	.val {
		flex: 1 1 18ch;
		min-width: 0;
	}

	.key {
		flex: none;
		font-weight: 800;
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		padding: 0.1rem 0.5rem;
		border-radius: 999px;
	}

	.bad .key {
		background: var(--red-soft);
		color: var(--red-dark);
	}

	.good .key {
		background: var(--green-soft);
		color: var(--green-dark);
	}

	.pairs {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: 0.4rem;
		font-size: 0.9rem;
	}

	.pairs li {
		display: grid;
		gap: 0.05rem;
		padding-left: 0.7rem;
		border-left: 3px solid var(--green);
		line-height: 1.45;
	}

	.pairs li.missed {
		border-left-color: var(--red);
	}

	.pairs strong {
		color: var(--ink);
	}

	.explain {
		font-size: 0.88rem;
		max-width: var(--reading);
	}

	.actions {
		justify-content: center;
	}

	.levelup-banner {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.6rem 1.2rem;
		border-radius: var(--radius-lg);
		background: var(--yellow);
		border: 2px solid #d4a300;
		color: #543f00;
		font-weight: 800;
		animation: pop 500ms var(--ease);
	}

	.levelup-emoji {
		font-size: 1.6rem;
		line-height: 1;
	}

	.levelup-text {
		font-size: 0.95rem;
	}

	@keyframes pop {
		from {
			opacity: 0;
			transform: scale(0.85);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
</style>
