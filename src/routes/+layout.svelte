<script lang="ts">
	import '$lib/styles/app.css';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import NicknameModal from '$lib/components/NicknameModal.svelte';
	import { profile } from '$lib/state/profile.svelte';

	let { children } = $props();

	let editingNickname = $state(false);
	let nicknameInput = $state('');

	onMount(() => {
		profile.load();
	});

	function startEdit() {
		nicknameInput = profile.nickname;
		editingNickname = true;
	}

	function saveNickname() {
		profile.setNickname(nicknameInput);
		editingNickname = false;
	}

	function cancelEdit() {
		editingNickname = false;
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') saveNickname();
		if (e.key === 'Escape') cancelEdit();
	}
</script>

<svelte:head>
	<title>Squizito</title>
	<link rel="icon" href={favicon} />
	<meta
		name="description"
		content="Carica un quiz generato da NotebookLM, mettiti alla prova e ripassa quello che sbagli."
	/>
</svelte:head>

{#if !profile.nickname}
	<NicknameModal />
{/if}

<header>
	<a class="brand" href={resolve('/')}>
		<span class="mark" aria-hidden="true">😋🧠</span>
		<span class="name">Squizito</span>
	</a>

	{#if profile.nickname}
		<div class="profile-bar">
			{#if profile.streak > 0}
				<span class="streak" title="Giorni consecutivi di studio">
					🔥 {profile.streak}
				</span>
			{/if}

			<span class="level" title="Livello corrente">
				{profile.level.emoji}
				{profile.level.name}
			</span>

			{#if editingNickname}
				<span class="nickname-edit">
					<input
						type="text"
						class="nickname-input"
						maxlength="20"
						bind:value={nicknameInput}
						{onkeydown}
						autofocus
					/>
					<button class="save-btn" onclick={saveNickname}>✓</button>
					<button class="cancel-btn" onclick={cancelEdit}>✕</button>
				</span>
			{:else}
				<button class="nickname-btn" onclick={startEdit} title="Cambia nickname">
					{profile.nickname}
					<span class="edit-hint" aria-hidden="true">✎</span>
				</button>
			{/if}
		</div>
	{/if}
</header>

{@render children()}

<footer>fatto con amore per k.</footer>

<style>
	header {
		width: min(920px, 100% - 2.5rem);
		margin-inline: auto;
		padding-top: 1.75rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
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

	.profile-bar {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex-wrap: wrap;
	}

	.streak {
		font-size: 0.95rem;
		font-weight: 800;
		padding: 0.25rem 0.65rem;
		border-radius: 999px;
		background: var(--orange-soft);
		color: var(--orange-dark);
		border: 2px solid var(--orange);
		white-space: nowrap;
	}

	.level {
		font-size: 0.88rem;
		font-weight: 700;
		padding: 0.25rem 0.65rem;
		border-radius: 999px;
		background: var(--bg-tint);
		color: var(--ink-soft);
		border: 2px solid var(--line);
		white-space: nowrap;
	}

	.nickname-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.9rem;
		font-weight: 800;
		font-family: inherit;
		color: var(--ink);
		background: none;
		border: 2px solid transparent;
		border-radius: 999px;
		padding: 0.25rem 0.65rem;
		cursor: pointer;
		transition:
			background var(--speed) var(--ease),
			border-color var(--speed) var(--ease);
	}

	.nickname-btn:hover {
		background: var(--bg-tint);
		border-color: var(--line);
	}

	.edit-hint {
		font-size: 0.75rem;
		opacity: 0.5;
	}

	.nickname-edit {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
	}

	.nickname-input {
		font-size: 0.9rem;
		font-weight: 700;
		font-family: inherit;
		padding: 0.2rem 0.5rem;
		border: 2px solid var(--orange);
		border-radius: 999px;
		background: var(--bg);
		color: var(--ink);
		width: 10ch;
		outline: none;
	}

	.save-btn,
	.cancel-btn {
		width: 1.6rem;
		height: 1.6rem;
		border-radius: 50%;
		border: 2px solid var(--line);
		background: var(--bg-tint);
		cursor: pointer;
		font-size: 0.75rem;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background var(--speed) var(--ease);
	}

	.save-btn:hover {
		background: var(--green-soft);
		border-color: var(--green);
	}

	.cancel-btn:hover {
		background: var(--red-soft);
		border-color: var(--red);
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
