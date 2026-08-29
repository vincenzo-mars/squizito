<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import AnswerBurst from '$lib/components/AnswerBurst.svelte';
	import Button from '$lib/components/Button.svelte';
	import MatchBoard from '$lib/components/MatchBoard.svelte';
	import OptionButton from '$lib/components/OptionButton.svelte';
	import ScoreBar from '$lib/components/ScoreBar.svelte';
	import { LETTERS } from '$lib/format';
	import { run } from '$lib/state/run.svelte';
	import { settings } from '$lib/state/settings.svelte';
	import { sfx } from '$lib/audio/sfx';

	let ready = $state(false);
	let burst = $state<{ id: number; kind: 'correct' | 'wrong'; points: number } | null>(null);
	let feedbackEl = $state<HTMLElement>();
	let timer: ReturnType<typeof setTimeout> | null = null;
	let burstTimer: ReturnType<typeof setTimeout> | null = null;

	let entry = $derived(run.current);
	let question = $derived(run.currentQuestion);
	let revealed = $derived(run.revealed);
	let options = $derived(
		entry && question
			? entry.optionOrder.map((index) => ({ index, option: question.options[index] }))
			: []
	);
	let isMatch = $derived(question?.kind === 'match');
	/** Matching and multiple-answer questions are confirmed explicitly, single choice is not. */
	let needsConfirm = $derived(isMatch || (question?.multiple ?? false));
	let canConfirm = $derived(isMatch ? run.linked : (entry?.selected.length ?? 0) > 0);
	// Only pin the footer when it actually holds a button, otherwise it just eats screen.
	let hasAction = $derived(run.mode === 'exam' || revealed || needsConfirm);

	onMount(() => {
		settings.load();
		sfx.enabled = settings.sound;

		if (!run.restore()) {
			goto(resolve('/'));
			return;
		}
		if (run.finished) {
			goto(resolve('/risultati'));
			return;
		}
		ready = true;
	});

	onDestroy(() => {
		if (timer) clearTimeout(timer);
		if (burstTimer) clearTimeout(burstTimer);
	});

	function optionState(index: number): 'idle' | 'correct' | 'wrong' | 'missed' {
		if (!revealed || !entry || !question) return 'idle';
		const correct = question.options[index].correct;
		const picked = entry.selected.includes(index);
		if (correct && picked) return 'correct';
		if (!correct && picked) return 'wrong';
		if (correct && !picked) return 'missed';
		return 'idle';
	}

	function choose(index: number) {
		if (!entry || (run.mode === 'study' && entry.answered)) return;

		const answeredBefore = entry.answered;
		run.toggle(index);

		if (!answeredBefore && run.current?.answered) afterAnswer();
		else sfx.select();
	}

	function confirm() {
		if (!canConfirm || entry?.answered) return;
		run.answer();
		if (run.mode === 'exam') advance();
		else afterAnswer();
	}

	async function afterAnswer() {
		const current = run.current;
		if (!current) return;

		// With long options the feedback lands well below the fold: bring it into view.
		await tick();
		feedbackEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

		const id = Date.now();
		burst = { id, kind: current.correct ? 'correct' : 'wrong', points: current.points };

		// The overlay is a one-shot animation: drop it from the DOM once it has played out.
		if (burstTimer) clearTimeout(burstTimer);
		burstTimer = setTimeout(() => {
			if (burst?.id === id) burst = null;
		}, 1100);

		if (current.correct) {
			if (run.streak >= 3) sfx.streak(run.streak);
			else sfx.correct();
		} else {
			sfx.wrong();
		}

		if (run.autoAdvance) {
			if (timer) clearTimeout(timer);
			timer = setTimeout(advance, current.correct ? 1300 : 2200);
		}
	}

	function advance() {
		if (timer) clearTimeout(timer);
		window.scrollTo({ top: 0, behavior: 'smooth' });
		if (run.isLast) {
			run.finish();
			goto(resolve('/risultati'));
			return;
		}
		burst = null;
		run.next();
	}

	function quit() {
		run.reset();
		goto(resolve('/quiz'));
	}

	function onKeydown(event: KeyboardEvent) {
		if (!ready || event.metaKey || event.ctrlKey || event.altKey) return;

		if (event.key === 'Enter') {
			event.preventDefault();
			if (run.mode === 'study' && revealed) advance();
			else if (canConfirm && !entry?.answered) confirm();
			return;
		}

		if (isMatch) return;

		const digit = Number(event.key);
		if (!Number.isInteger(digit) || digit < 1 || digit > options.length) return;
		event.preventDefault();
		choose(options[digit - 1].index);
	}
</script>

<svelte:window onkeydown={onKeydown} />

<main class="page">
	{#if ready && entry && question}
		<div class="topbar">
			<ScoreBar position={run.position} total={run.total} score={run.score} streak={run.streak} />
		</div>

		{#key entry.index}
			<section class="surface question">
				<div class="meta">
					{#if question.tag}<span class="tag">{question.tag}</span>{/if}
					{#if question.kind === 'match'}
						<span class="tag multi">collega ogni termine alla sua definizione</span>
					{:else if question.multiple}
						<span class="tag multi">scegli tutte le corrette</span>
					{/if}
				</div>
				<h1 class:long={question.text.length > 110} class:xlong={question.text.length > 260}>
					{question.text}
				</h1>

				{#if question.kind === 'match'}
					<MatchBoard
						pairs={question.pairs}
						leftOrder={entry.leftOrder}
						rightOrder={entry.rightOrder}
						links={entry.links}
						{revealed}
						onlink={(name, definition) => {
							run.link(name, definition);
							sfx.select();
						}}
						onunlink={(name) => run.unlink(name)}
					/>
				{:else}
					<div class="options">
						{#each options as { index, option }, position (index)}
							<OptionButton
								text={option.text}
								letter={LETTERS[position]}
								selected={entry.selected.includes(index)}
								state={optionState(index)}
								multiple={question.multiple}
								disabled={revealed}
								onclick={() => choose(index)}
							/>
						{/each}
					</div>
				{/if}
			</section>
		{/key}

		{#if revealed}
			<section
				bind:this={feedbackEl}
				class="feedback"
				class:good={entry.correct}
				class:bad={!entry.correct}
			>
				<div class="row">
					<strong>{entry.correct ? 'Giusta!' : 'Sbagliata'}</strong>
					{#if entry.correct}<span class="points">+{entry.points} pt</span>{/if}
				</div>
				{#if question.explanation}
					<p>{question.explanation}</p>
				{/if}
			</section>
		{/if}

		<div class="actions" class:pinned={hasAction}>
			{#if run.mode === 'study'}
				{#if revealed}
					<Button size="lg" variant={entry.correct ? 'primary' : 'blue'} onclick={advance} full>
						{run.isLast ? 'Vedi i risultati' : 'Avanti'}
					</Button>
				{:else if needsConfirm}
					<Button size="lg" onclick={confirm} disabled={!canConfirm} full>Conferma</Button>
				{:else}
					<p class="hint muted">Scegli una risposta, oppure premi il numero corrispondente.</p>
				{/if}
			{:else}
				<Button size="lg" onclick={confirm} disabled={!canConfirm} full>
					{run.isLast ? 'Consegna' : 'Avanti'}
				</Button>
			{/if}

			<button class="quit" onclick={quit}>Esci dal test</button>
		</div>

		{#if burst}
			{#key burst.id}
				<AnswerBurst kind={burst.kind} />
				{#if burst.kind === 'correct'}
					<span class="burst">+{burst.points}</span>
				{/if}
			{/key}
		{/if}
	{/if}
</main>

<style>
	/* Progress and score stay visible while a long question scrolls under them. */
	.topbar {
		position: sticky;
		top: 0;
		z-index: 5;
		padding: 0.75rem 0 1rem;
		margin-block: -0.75rem -1rem;
		background: linear-gradient(var(--bg) calc(100% - 1rem), transparent);
	}

	.question {
		display: grid;
		gap: 1.1rem;
		animation: slide 320ms var(--ease);
	}

	h1 {
		font-size: clamp(1.3rem, 3.4vw, 1.85rem);
		line-height: 1.3;
		max-width: var(--reading);
	}

	/* Long prompts step down instead of eating the screen before the options appear. */
	h1.long {
		font-size: clamp(1.15rem, 2.6vw, 1.45rem);
	}

	h1.xlong {
		font-size: clamp(1.05rem, 2.2vw, 1.2rem);
		line-height: 1.45;
	}

	.meta {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.tag {
		font-size: 0.7rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		padding: 0.15rem 0.6rem;
		border-radius: 999px;
		background: var(--plum);
		color: #fff;
	}

	.tag.multi {
		background: var(--blue);
	}

	.options {
		display: grid;
		gap: 0.7rem;
	}

	.feedback {
		max-width: var(--reading);
		border-radius: var(--radius-lg);
		border: 2px solid;
		padding: 1rem 1.25rem;
		display: grid;
		gap: 0.4rem;
		animation: slide 280ms var(--ease);
	}

	.feedback.good {
		background: var(--green-soft);
		border-color: var(--green);
		color: #2c5c00;
	}

	.feedback.bad {
		background: var(--red-soft);
		border-color: var(--red);
		color: #7a1f1f;
	}

	.feedback strong {
		font-size: 1.1rem;
	}

	.points {
		margin-left: auto;
		font-weight: 800;
	}

	.actions {
		display: grid;
		gap: 0.6rem;
		justify-items: center;
		width: 100%;
	}

	/* The action button stays reachable without scrolling past a wall of long options. */
	.actions.pinned {
		position: sticky;
		bottom: 0;
		z-index: 5;
		padding: 1.5rem 0 0.75rem;
		margin-bottom: -0.75rem;
		background: linear-gradient(transparent, var(--bg) 1.5rem);
	}

	.hint {
		font-size: 0.9rem;
		text-align: center;
	}

	.quit {
		border: none;
		background: none;
		color: var(--ink-soft);
		font-weight: 700;
		font-size: 0.85rem;
		cursor: pointer;
		text-decoration: underline;
	}

	.burst {
		position: fixed;
		left: 50%;
		bottom: 22%;
		transform: translateX(-50%);
		font-size: 2.2rem;
		font-weight: 900;
		color: var(--green-dark);
		text-shadow: 0 2px 0 #fff;
		pointer-events: none;
		animation: fly 1100ms var(--ease) forwards;
	}

	@keyframes slide {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@keyframes fly {
		0% {
			opacity: 0;
			transform: translate(-50%, 20px) scale(0.8);
		}
		25% {
			opacity: 1;
			transform: translate(-50%, -10px) scale(1.1);
		}
		100% {
			opacity: 0;
			transform: translate(-50%, -90px) scale(1);
		}
	}
</style>
