<script lang="ts">
	import Button from './Button.svelte';
	import { formatDate, percentage } from '$lib/format';
	import type { Attempt, StoredQuiz } from '$lib/storage/types';

	let {
		quiz,
		best,
		last,
		onopen,
		onrename,
		ondelete
	}: {
		quiz: StoredQuiz;
		best: Attempt | undefined;
		last: Attempt | undefined;
		onopen: () => void;
		onrename: () => void;
		ondelete: () => void;
	} = $props();

	let attempts = $derived(quiz.attempts.length);
</script>

<article class="card">
	<div class="head">
		<h3>{quiz.title}</h3>
		<div class="tools">
			<button class="icon" onclick={onrename} title="Rinomina" aria-label="Rinomina {quiz.title}">
				✎
			</button>
			<button
				class="icon danger"
				onclick={ondelete}
				title="Elimina"
				aria-label="Elimina {quiz.title}"
			>
				🗑
			</button>
		</div>
	</div>

	<div class="stats">
		<span class="pill">{quiz.questionCount} domande</span>
		<span class="pill">{attempts} {attempts === 1 ? 'tentativo' : 'tentativi'}</span>
		{#if best}
			<span class="pill gold">🏆 {best.score} pt · {percentage(best.correct, best.total)}%</span>
		{/if}
	</div>

	<p class="meta muted">
		{#if last}
			Ultimo tentativo il {formatDate(last.at)}: {last.correct}/{last.total} giuste
		{:else}
			Caricato il {formatDate(quiz.addedAt)}, mai provato
		{/if}
	</p>

	<Button onclick={onopen} full>{attempts ? 'Riapri' : 'Apri'}</Button>
</article>

<style>
	.card {
		display: grid;
		gap: 0.85rem;
		align-content: start;
		background: var(--surface);
		border: 2px solid var(--line);
		border-radius: var(--radius-lg);
		padding: 1.25rem;
		box-shadow: var(--shadow);
		transition:
			transform var(--speed) var(--ease),
			border-color var(--speed) var(--ease);
	}

	.card:hover {
		transform: translateY(-3px);
		border-color: var(--line-strong);
	}

	.head {
		display: flex;
		gap: 0.5rem;
		align-items: start;
	}

	h3 {
		font-size: 1.1rem;
		flex: 1;
	}

	.tools {
		display: flex;
		gap: 0.25rem;
	}

	.icon {
		border: none;
		background: transparent;
		border-radius: 10px;
		padding: 0.3rem 0.45rem;
		cursor: pointer;
		font-size: 0.95rem;
		color: var(--ink-soft);
		transition: background var(--speed) var(--ease);
	}

	.icon:hover {
		background: var(--bg-tint);
	}

	.icon.danger:hover {
		background: var(--red-soft);
	}

	.stats {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.pill {
		font-size: 0.78rem;
		font-weight: 800;
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
		background: var(--bg-tint);
		color: var(--ink-soft);
	}

	.gold {
		background: var(--yellow);
		color: #4a3800;
	}

	.meta {
		font-size: 0.85rem;
	}
</style>
