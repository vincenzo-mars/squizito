<script lang="ts">
	import { profile } from '$lib/state/profile.svelte';

	let value = $state('');
	let error = $state('');

	function submit() {
		const trimmed = value.trim();
		if (!trimmed) {
			error = 'Inserisci un nickname per continuare.';
			return;
		}
		if (trimmed.length > 20) {
			error = 'Massimo 20 caratteri.';
			return;
		}
		profile.setNickname(trimmed);
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') submit();
	}
</script>

<dialog
	open
	aria-modal="true"
	aria-label="Benvenuto in Squizito"
	onkeydown={(e) => e.key === 'Escape' && e.preventDefault()}
>
	<div class="card">
		<span class="logo" aria-hidden="true">😋🧠</span>
		<h2>Benvenuto in Squizito</h2>
		<p class="lead">Scegli un nickname per iniziare a studiare.</p>

		<label for="nickname-input" class="sr-only">Nickname</label>
		<input
			id="nickname-input"
			type="text"
			placeholder="Il tuo nome o nickname"
			maxlength="20"
			autocomplete="off"
			bind:value
			{onkeydown}
		/>

		{#if error}
			<p class="err" role="alert">{error}</p>
		{/if}

		<button class="btn-primary" onclick={submit}>Inizia</button>
	</div>
</dialog>

<style>
	dialog {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		max-width: none;
		max-height: none;
		border: none;
		padding: 1rem;
		background: rgba(0, 0, 0, 0.55);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
		z-index: 999;
		animation: fade-in 200ms ease;
	}

	.card {
		background: var(--surface);
		border: 2px solid var(--line);
		border-radius: var(--radius-lg);
		box-shadow:
			0 8px 0 var(--line-strong),
			0 24px 48px rgba(0, 0, 0, 0.18);
		padding: 2.5rem 2rem;
		display: grid;
		gap: 1rem;
		width: min(420px, 100%);
		text-align: center;
		animation: slide-up 280ms var(--ease);
	}

	.logo {
		font-size: 3rem;
		line-height: 1;
	}

	h2 {
		font-size: 1.6rem;
		font-weight: 800;
		letter-spacing: -0.02em;
		margin: 0;
	}

	.lead {
		color: var(--ink-soft);
		font-size: 0.95rem;
		margin: 0;
	}

	input {
		width: 100%;
		padding: 0.75rem 1rem;
		border-radius: var(--radius);
		border: 2px solid var(--line);
		background: var(--bg);
		color: var(--ink);
		font-size: 1rem;
		font-family: inherit;
		font-weight: 600;
		transition: border-color var(--speed) var(--ease);
		box-sizing: border-box;
	}

	input:focus {
		outline: none;
		border-color: var(--orange);
	}

	input::placeholder {
		color: var(--ink-soft);
		font-weight: 400;
	}

	.err {
		font-size: 0.88rem;
		color: var(--red-dark);
		margin: 0;
		font-weight: 700;
	}

	.btn-primary {
		padding: 0.85rem 1.5rem;
		border-radius: var(--radius);
		border: 2px solid var(--orange);
		background: var(--orange-soft);
		box-shadow: 0 var(--depth) 0 var(--orange-dark);
		color: var(--orange-dark);
		font-size: 1rem;
		font-family: inherit;
		font-weight: 800;
		cursor: pointer;
		transition:
			transform var(--speed) var(--ease),
			box-shadow var(--speed) var(--ease);
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 calc(var(--depth) + 2px) 0 var(--orange-dark);
	}

	.btn-primary:active {
		transform: translateY(2px);
		box-shadow: none;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slide-up {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
</style>
