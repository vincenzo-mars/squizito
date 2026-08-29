<script lang="ts">
	let { kind }: { kind: 'correct' | 'wrong' } = $props();

	/** Satellites fly out around the main emoji: angle in degrees, distance in px, delay in ms. */
	const SATELLITES = [
		{ angle: -140, distance: 190, delay: 0 },
		{ angle: -50, distance: 210, delay: 40 },
		{ angle: 30, distance: 180, delay: 80 },
		{ angle: 130, distance: 200, delay: 120 },
		{ angle: 180, distance: 160, delay: 60 }
	];

	let face = $derived(kind === 'correct' ? '😋' : '😵‍💫');
	let crowd = $derived(
		kind === 'correct' ? ['😋', '🤤', '🧠', '😋', '🤤'] : ['💫', '😵', '💫', '🌀', '😵']
	);
</script>

<div class="burst {kind}" aria-hidden="true">
	<div class="glow"></div>
	<div class="face">{face}</div>
	{#each SATELLITES as satellite, index (index)}
		<div
			class="satellite"
			style="--angle: {satellite.angle}deg; --distance: {satellite.distance}px; animation-delay: {satellite.delay}ms"
		>
			{crowd[index]}
		</div>
	{/each}
</div>

<style>
	.burst {
		position: fixed;
		inset: 0;
		display: grid;
		place-items: center;
		pointer-events: none;
		z-index: 60;
	}

	.glow {
		position: absolute;
		width: min(70vmin, 460px);
		aspect-ratio: 1;
		border-radius: 50%;
		background: radial-gradient(circle, var(--tint) 0%, transparent 68%);
		animation: glow 760ms var(--ease) forwards;
	}

	.correct .glow {
		--tint: rgb(255 140 66 / 0.5);
	}

	.wrong .glow {
		--tint: rgb(255 75 75 / 0.42);
	}

	.face {
		position: relative;
		font-size: clamp(4.5rem, 22vmin, 9rem);
		line-height: 1;
		filter: drop-shadow(0 8px 18px rgb(90 60 40 / 0.3));
	}

	.correct .face {
		animation: gnam 900ms var(--ease) forwards;
	}

	.wrong .face {
		animation: scombussola 950ms var(--ease) forwards;
	}

	.satellite {
		position: absolute;
		font-size: clamp(1.6rem, 6vmin, 2.6rem);
		opacity: 0;
		animation: fly 850ms var(--ease) forwards;
	}

	@keyframes glow {
		0% {
			opacity: 0;
			transform: scale(0.4);
		}
		35% {
			opacity: 1;
			transform: scale(1);
		}
		100% {
			opacity: 0;
			transform: scale(1.15);
		}
	}

	/* A bite: the face lunges forward, chomps twice, then backs off. */
	@keyframes gnam {
		0% {
			opacity: 0;
			transform: scale(0.3) rotate(-12deg);
		}
		30% {
			opacity: 1;
			transform: scale(1.18) rotate(6deg);
		}
		45% {
			transform: scale(0.94) rotate(-4deg);
		}
		60% {
			transform: scale(1.08) rotate(3deg);
		}
		100% {
			opacity: 0;
			transform: scale(0.86) translateY(-26px);
		}
	}

	/* Dizzy: the face wobbles off its axis before dissolving. */
	@keyframes scombussola {
		0% {
			opacity: 0;
			transform: scale(0.5) rotate(0deg);
		}
		25% {
			opacity: 1;
			transform: scale(1.1) rotate(-14deg) translateX(-14px);
		}
		45% {
			transform: scale(1.02) rotate(13deg) translateX(16px);
		}
		65% {
			transform: scale(1.04) rotate(-9deg) translateX(-10px);
		}
		82% {
			transform: scale(1) rotate(5deg) translateX(6px);
		}
		100% {
			opacity: 0;
			transform: scale(0.9) rotate(0deg) translateY(14px);
		}
	}

	@keyframes fly {
		0% {
			opacity: 0;
			transform: rotate(var(--angle)) translateX(0) rotate(calc(var(--angle) * -1)) scale(0.4);
		}
		35% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: rotate(var(--angle)) translateX(var(--distance)) rotate(calc(var(--angle) * -1))
				scale(1);
		}
	}
</style>
