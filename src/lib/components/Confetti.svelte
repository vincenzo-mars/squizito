<script lang="ts">
	import { onMount } from 'svelte';

	let { pieces = 140, duration = 3200 }: { pieces?: number; duration?: number } = $props();

	let canvas: HTMLCanvasElement;

	type Piece = {
		x: number;
		y: number;
		vx: number;
		vy: number;
		size: number;
		spin: number;
		angle: number;
		color: string;
	};

	const COLORS = ['#58cc02', '#1cb0f6', '#ffc800', '#ce82ff', '#ff4b4b'];

	onMount(() => {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const dpr = window.devicePixelRatio || 1;
		const width = window.innerWidth;
		const height = window.innerHeight;

		canvas.width = width * dpr;
		canvas.height = height * dpr;
		ctx.scale(dpr, dpr);

		const confetti: Piece[] = Array.from({ length: pieces }, () => ({
			x: width / 2 + (Math.random() - 0.5) * width * 0.6,
			y: height * 0.35 + Math.random() * 40,
			vx: (Math.random() - 0.5) * 9,
			vy: -6 - Math.random() * 9,
			size: 6 + Math.random() * 8,
			spin: (Math.random() - 0.5) * 0.3,
			angle: Math.random() * Math.PI,
			color: COLORS[Math.floor(Math.random() * COLORS.length)]
		}));

		const started = performance.now();
		let frame = 0;

		const tick = (now: number) => {
			const elapsed = now - started;
			ctx.clearRect(0, 0, width, height);

			for (const piece of confetti) {
				piece.vy += 0.28;
				piece.vx *= 0.995;
				piece.x += piece.vx;
				piece.y += piece.vy;
				piece.angle += piece.spin;

				ctx.save();
				ctx.translate(piece.x, piece.y);
				ctx.rotate(piece.angle);
				ctx.globalAlpha = Math.max(0, 1 - elapsed / duration);
				ctx.fillStyle = piece.color;
				ctx.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2);
				ctx.restore();
			}

			if (elapsed < duration) frame = requestAnimationFrame(tick);
			else ctx.clearRect(0, 0, width, height);
		};

		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	});
</script>

<canvas bind:this={canvas} aria-hidden="true"></canvas>

<style>
	canvas {
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 50;
	}
</style>
