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
	// Il badge segue la punta della barra, ma resta dentro i bordi anche a inizio/fine corsa.
	let badgePosition = $derived(Math.min(94, Math.max(6, progress)));
</script>

<div class="bar">
	<div class="track-wrap">
		<div
			class="track"
			role="progressbar"
			aria-valuenow={position}
			aria-valuemin={1}
			aria-valuemax={total}
		>
			<div class="fill" style="width: {progress}%"></div>
		</div>
		{#if streak >= 2}
			<span class="streak" style="left: {badgePosition}%" title="risposte giuste di fila">
				🔥{streak}
			</span>
		{/if}
	</div>
	<div class="meta">
		<span class="counter">{position} / {total}</span>
		<span class="score">{displayed} pt</span>
	</div>
</div>

<style>
	.bar {
		display: grid;
		gap: 0.6rem;
	}

	.track-wrap {
		position: relative;
		/* Spazio sopra la barra per il badge che sporge dalla punta. */
		padding-top: 1.4rem;
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
		background: linear-gradient(90deg, var(--orange), #ffc233);
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
		position: absolute;
		top: 0;
		transform: translateX(-50%);
		background: var(--yellow);
		color: #543f00;
		padding: 0.1rem 0.5rem;
		border-radius: 999px;
		font-size: 0.85rem;
		white-space: nowrap;
		transition: left 420ms var(--ease);
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
