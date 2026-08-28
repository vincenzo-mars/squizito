<script lang="ts">
	type State = 'idle' | 'correct' | 'wrong' | 'missed';

	let {
		text,
		letter,
		selected = false,
		state = 'idle',
		disabled = false,
		multiple = false,
		onclick
	}: {
		text: string;
		letter: string;
		selected?: boolean;
		state?: State;
		disabled?: boolean;
		multiple?: boolean;
		onclick: () => void;
	} = $props();
</script>

<button
	class="option {state}"
	class:selected
	{disabled}
	{onclick}
	aria-pressed={multiple ? selected : undefined}
>
	<span class="letter" aria-hidden="true">{letter}</span>
	<span class="text">{text}</span>
	{#if state === 'correct'}
		<span class="mark" aria-label="risposta corretta">✓</span>
	{:else if state === 'wrong'}
		<span class="mark" aria-label="risposta sbagliata">✕</span>
	{:else if state === 'missed'}
		<span class="mark" aria-label="risposta corretta mancata">✓</span>
	{/if}
</button>

<style>
	.option {
		--edge: var(--line-strong);
		--tint: var(--surface);

		display: flex;
		align-items: flex-start;
		gap: 0.9rem;
		width: 100%;
		text-align: left;
		padding: 0.95rem 1.1rem;
		border: 2px solid var(--line);
		border-radius: var(--radius);
		background: var(--tint);
		box-shadow: 0 var(--depth) 0 var(--edge);
		color: var(--ink);
		font-weight: 700;
		cursor: pointer;
		transition:
			transform var(--speed) var(--ease),
			background var(--speed) var(--ease),
			border-color var(--speed) var(--ease),
			box-shadow var(--speed) var(--ease);
	}

	.option:hover:not(:disabled) {
		transform: translateY(-2px);
		border-color: var(--line-strong);
	}

	.option:active:not(:disabled) {
		transform: translateY(var(--depth));
		box-shadow: 0 0 0 var(--edge);
	}

	.option:disabled {
		cursor: default;
	}

	.selected {
		--tint: var(--blue-soft);
		--edge: var(--blue-dark);
		border-color: var(--blue);
	}

	.correct {
		--tint: var(--green-soft);
		--edge: var(--green-dark);
		border-color: var(--green);
		animation: pop 320ms var(--ease);
	}

	.wrong {
		--tint: var(--red-soft);
		--edge: var(--red-dark);
		border-color: var(--red);
		animation: shake 380ms var(--ease);
	}

	.missed {
		--tint: var(--green-soft);
		--edge: var(--green-dark);
		border-color: var(--green);
		opacity: 0.85;
		border-style: dashed;
	}

	.letter {
		flex: none;
		display: grid;
		place-items: center;
		margin-top: 1px;
		width: 32px;
		height: 32px;
		border-radius: 10px;
		background: rgb(43 52 69 / 0.06);
		font-size: 0.85rem;
		font-weight: 800;
		color: var(--ink-soft);
	}

	.text {
		flex: 1;
		line-height: 1.45;
		padding-block: 0.25rem;
	}

	.mark {
		flex: none;
		margin-top: 2px;
		font-size: 1.15rem;
		font-weight: 900;
	}

	.correct .mark,
	.missed .mark {
		color: var(--green-dark);
	}

	.wrong .mark {
		color: var(--red-dark);
	}

	@keyframes pop {
		0% {
			transform: scale(1);
		}
		45% {
			transform: scale(1.03);
		}
		100% {
			transform: scale(1);
		}
	}

	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		20% {
			transform: translateX(-7px);
		}
		45% {
			transform: translateX(6px);
		}
		70% {
			transform: translateX(-3px);
		}
	}
</style>
