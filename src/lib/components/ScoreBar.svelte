<script lang="ts">
	let {
		position,
		total,
		score,
		streak
	}: { position: number; total: number; score: number; streak: number } = $props();

	let displayed = $state(0);
	// Kept outside the reactive graph: reading `displayed` in the effect would retrigger it.
	let shown = 0;
	let frame = 0;

	// Count-up so the score visibly climbs instead of jumping.
	$effect(() => {
		const target = score;
		const from = shown;
		const start = performance.now();
		const span = 420;

		cancelAnimationFrame(frame);

		// A hidden tab never fires rAF: show the real value instead of freezing at the old one.
		if (typeof document !== 'undefined' && document.hidden) {
			shown = target;
			displayed = target;
			return;
		}

		const tick = (now: number) => {
			const t = Math.min(1, (now - start) / span);
			shown = Math.round(from + (target - from) * (1 - Math.pow(1 - t, 3)));
			displayed = shown;
			if (t < 1) frame = requestAnimationFrame(tick);
		};

		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	});

	let progress = $derived(total ? ((position - 1) / total) * 100 : 0);
</script>

<div class="bar">
	<div
		class="track"
		role="progressbar"
		aria-valuenow={position}
		aria-valuemin={1}
		aria-valuemax={total}
	>
		<div class="fill" style="width: {progress}%"></div>
	</div>
	<div class="meta">
		<span class="counter">{position} / {total}</span>
		{#if streak >= 2}
			<span class="streak" title="risposte giuste di fila">🔥 {streak}</span>
		{/if}
		<span class="score">{displayed} pt</span>
	</div>
</div>

<style>
	.bar {
		display: grid;
		gap: 0.6rem;
	}

	.track {
		height: 14px;
		border-radius: 999px;
		background: var(--bg-tint);
		overflow: hidden;
		border: 2px solid var(--line);
	}

	.fill {
		height: 100%;
		border-radius: 999px;
		background: linear-gradient(90deg, var(--green), #8ee04a);
		transition: width 420ms var(--ease);
	}

	.meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-weight: 800;
		color: var(--ink-soft);
		font-size: 0.9rem;
	}

	.score {
		margin-left: auto;
		color: var(--ink);
		font-size: 1.05rem;
	}

	.streak {
		background: var(--yellow);
		color: #4a3800;
		padding: 0.1rem 0.55rem;
		border-radius: 999px;
		animation: bump 320ms var(--ease);
	}

	@keyframes bump {
		from {
			transform: scale(0.8);
		}
		to {
			transform: scale(1);
		}
	}
</style>
