<script lang="ts">
	import '$lib/styles/app.css';
	import { resolve } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<title>Quizzo</title>
	<link rel="icon" href={favicon} />
	<meta name="description" content="Carica un quiz generato da NotebookLM e mettiti alla prova." />
</svelte:head>

<header>
	<a class="brand" href={resolve('/')}>
		<span class="mark" aria-hidden="true">?</span>
		<span class="name">Quizzo</span>
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
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
		border-radius: 12px;
		background: var(--green);
		color: #fff;
		font-weight: 900;
		font-size: 1.25rem;
		box-shadow: 0 3px 0 var(--green-dark);
		transform: rotate(-6deg);
	}

	.name {
		font-size: 1.35rem;
		font-weight: 800;
		letter-spacing: -0.02em;
	}
</style>
