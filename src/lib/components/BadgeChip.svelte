<script lang="ts">
	import type { Badge } from '$lib/quiz/badges';

	let { badge, delay = 0 }: { badge: Badge; delay?: number } = $props();
</script>

<div class="chip" style="animation-delay: {delay}ms" title={badge.description}>
	<span class="emoji" aria-hidden="true">{badge.emoji}</span>
	<span class="text">
		<span class="label">{badge.label}</span>
		<span class="desc">{badge.description}</span>
	</span>
</div>

<style>
	.chip {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		padding: 0.65rem 1rem;
		border-radius: 16px;
		background: var(--yellow);
		border: 2px solid var(--yellow-dark);
		box-shadow: 0 3px 0 var(--yellow-dark);
		color: #4a3800;
		animation: pop 420ms var(--ease) both;
	}

	.emoji {
		font-size: 1.5rem;
	}

	.text {
		display: grid;
	}

	.label {
		font-weight: 800;
	}

	.desc {
		font-size: 0.8rem;
		opacity: 0.8;
	}

	@keyframes pop {
		from {
			opacity: 0;
			transform: scale(0.7) translateY(8px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
</style>
