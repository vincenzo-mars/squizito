<script lang="ts">
	import '$lib/styles/app.css';
	import { resolve } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<title>Squizito</title>
	<link rel="icon" href={favicon} />
	<meta
		name="description"
		content="Carica un quiz generato da NotebookLM, mettiti alla prova e ripassa quello che sbagli."
	/>
</svelte:head>

<header>
	<a class="brand" href={resolve('/')}>
		<span class="mark" aria-hidden="true">😋🧠</span>
		<span class="name">Squizito</span>
	</a>
</header>

{@render children()}

<footer>fatto con amore per k.</footer>

<style>
	header {
		width: min(920px, 100% - 2.5rem);
		margin-inline: auto;
		padding-top: 1.75rem;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.8rem;
		text-decoration: none;
		color: var(--ink);
	}

	.mark {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 0.4rem 0.7rem;
		border-radius: 18px;
		background: var(--orange-soft);
		border: 3px solid var(--orange);
		font-size: clamp(1.5rem, 4vw, 2rem);
		line-height: 1;
		box-shadow: 0 4px 0 var(--orange-dark);
		transform: rotate(-4deg);
	}

	.name {
		font-size: clamp(1.9rem, 5vw, 2.6rem);
		font-weight: 800;
		letter-spacing: -0.03em;
	}

	footer {
		width: min(920px, 100% - 2.5rem);
		margin: -2.5rem auto 1.25rem;
		text-align: center;
		font-size: 0.62rem;
		letter-spacing: 0.06em;
		color: var(--ink-soft);
		opacity: 0.55;
	}
</style>
