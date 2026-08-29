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

<style>
	header {
		width: min(920px, 100% - 2.5rem);
		margin-inline: auto;
		padding-top: 1.5rem;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		text-decoration: none;
		color: var(--ink);
	}

	.mark {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		padding: 0.25rem 0.5rem;
		border-radius: 14px;
		background: var(--orange-soft);
		border: 2px solid var(--orange);
		font-size: 1.1rem;
		line-height: 1;
		box-shadow: 0 3px 0 var(--orange-dark);
		transform: rotate(-4deg);
	}

	.name {
		font-size: 1.35rem;
		font-weight: 800;
		letter-spacing: -0.02em;
	}
</style>
