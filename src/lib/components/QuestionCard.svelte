<script lang="ts">
	import type { Question } from '$lib/quiz/types';

	let {
		question,
		number,
		mastery = 0
	}: { question: Question; number: number; mastery?: number } = $props();

	const LABELS = [
		'mai vista',
		'da consolidare',
		'in costruzione',
		'quasi',
		'solida',
		'consolidata'
	];

	let expanded = $state(false);
	let long = $derived(question.text.length > 160);
</script>

<article class="card" style="animation-delay: {Math.min(number, 12) * 35}ms">
	<span class="number">{number}</span>
	<span class="mastery" title="Padronanza: {LABELS[mastery]}">
		{#each [1, 2, 3, 4, 5] as step (step)}
			<span class="dot" class:on={step <= mastery}></span>
		{/each}
		<span class="sr-only">Padronanza: {LABELS[mastery]}</span>
	</span>
	<div class="body">
		<p class="text" class:clamped={long && !expanded}>{question.text}</p>
		{#if long}
			<button class="more" onclick={() => (expanded = !expanded)} aria-expanded={expanded}>
				{expanded ? 'Riduci' : 'Mostra tutta la domanda'}
			</button>
		{/if}
		<div class="tags">
			{#if question.tag}<span class="tag">{question.tag}</span>{/if}
			{#if question.kind === 'match'}
				<span class="tag soft">{question.pairs.length} coppie</span>
				<span class="tag multi">collegamento</span>
			{:else}
				<span class="tag soft">{question.options.length} opzioni</span>
				{#if question.multiple}<span class="tag multi">risposta multipla</span>{/if}
			{/if}
		</div>
	</div>
</article>

<style>
	.card {
		display: flex;
		gap: 0.9rem;
		background: var(--surface);
		border: 2px solid var(--line);
		border-radius: var(--radius);
		padding: 1rem 1.1rem;
		box-shadow: 0 4px 14px rgb(43 52 69 / 0.05);
		animation: rise 360ms var(--ease) both;
		transition:
			transform var(--speed) var(--ease),
			border-color var(--speed) var(--ease);
	}

	.card:hover {
		transform: translateY(-2px);
		border-color: var(--line-strong);
	}

	.mastery {
		order: 3;
		flex: none;
		display: grid;
		gap: 3px;
		align-content: start;
		margin-top: 4px;
	}

	.dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--bg-tint);
	}

	.dot.on {
		background: var(--orange);
	}

	.number {
		flex: none;
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		border-radius: 10px;
		background: var(--blue-soft);
		color: var(--blue-dark);
		font-weight: 800;
		font-size: 0.85rem;
	}

	.body {
		display: grid;
		gap: 0.5rem;
	}

	.text {
		font-weight: 700;
		line-height: 1.5;
		max-width: var(--reading);
	}

	/* Long questions stay scannable in the list: three lines, then "mostra tutta". */
	.clamped {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		overflow: hidden;
	}

	.more {
		justify-self: start;
		border: none;
		background: none;
		padding: 0;
		font-size: 0.8rem;
		font-weight: 800;
		color: var(--blue-dark);
		cursor: pointer;
		text-decoration: underline;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.tag {
		font-size: 0.72rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		background: var(--plum);
		color: #fff;
	}

	.tag.soft {
		background: var(--bg-tint);
		color: var(--ink-soft);
	}

	.tag.multi {
		background: var(--blue);
		color: #fff;
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
</style>
