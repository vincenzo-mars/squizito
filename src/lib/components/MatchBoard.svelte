<script lang="ts">
	import type { MatchPair } from '$lib/quiz/types';

	let {
		pairs,
		leftOrder,
		rightOrder,
		links,
		revealed = false,
		onlink,
		onunlink
	}: {
		pairs: MatchPair[];
		leftOrder: number[];
		rightOrder: number[];
		links: (number | null)[];
		revealed?: boolean;
		onlink: (name: number, definition: number) => void;
		onunlink: (name: number) => void;
	} = $props();

	/** One colour per slot of the left column, so a link is recognisable on both sides. */
	const COLORS = [
		'#ff8c42',
		'#2fa8e0',
		'#b06fb0',
		'#56c02b',
		'#e05c5c',
		'#7c7ce0',
		'#d99a00',
		'#3fbfae'
	];

	let pickedName = $state<number | null>(null);
	let pickedDefinition = $state<number | null>(null);

	let nameOf = $derived((definition: number) => links.findIndex((value) => value === definition));
	let missed = $derived(links.some((value, index) => value !== index));
	let slotOf = $derived((name: number) => leftOrder.indexOf(name));

	function colorFor(name: number): string {
		return COLORS[slotOf(name) % COLORS.length];
	}

	function clickName(name: number) {
		if (revealed) return;

		if (links[name] !== null) {
			onunlink(name);
			pickedName = null;
			return;
		}
		if (pickedDefinition !== null) {
			onlink(name, pickedDefinition);
			pickedDefinition = null;
			pickedName = null;
			return;
		}
		pickedName = pickedName === name ? null : name;
	}

	function clickDefinition(definition: number) {
		if (revealed) return;

		const linked = nameOf(definition);
		if (linked >= 0) {
			onunlink(linked);
			pickedDefinition = null;
			return;
		}
		if (pickedName !== null) {
			onlink(pickedName, definition);
			pickedName = null;
			pickedDefinition = null;
			return;
		}
		pickedDefinition = pickedDefinition === definition ? null : definition;
	}

	function stateOf(name: number): 'idle' | 'linked' | 'right' | 'wrong' {
		if (!revealed) return links[name] === null ? 'idle' : 'linked';
		return links[name] === name ? 'right' : 'wrong';
	}
</script>

<div class="board" class:revealed>
	<div class="column names">
		{#each leftOrder as name (name)}
			{@const status = stateOf(name)}
			<button
				class="chip {status}"
				style="--link: {colorFor(name)}"
				class:picked={pickedName === name}
				disabled={revealed}
				onclick={() => clickName(name)}
			>
				{#if links[name] !== null}
					<span class="badge" style="background: {colorFor(name)}">{slotOf(name) + 1}</span>
				{/if}
				<span class="label">{pairs[name].name}</span>
			</button>
		{/each}
	</div>

	<div class="column definitions">
		{#each rightOrder as definition (definition)}
			{@const owner = nameOf(definition)}
			{@const status = owner >= 0 ? stateOf(owner) : 'idle'}
			<button
				class="card {status}"
				style="--link: {owner >= 0 ? colorFor(owner) : 'transparent'}"
				class:picked={pickedDefinition === definition}
				disabled={revealed}
				onclick={() => clickDefinition(definition)}
			>
				{#if owner >= 0}
					<span class="badge" style="background: {colorFor(owner)}">{slotOf(owner) + 1}</span>
				{/if}
				<span class="label">{pairs[definition].definition}</span>
			</button>
		{/each}
	</div>
</div>

{#if revealed && missed}
	<ul class="solution">
		{#each leftOrder as name (name)}
			{#if links[name] !== name}
				<li>
					<strong>{pairs[name].name}</strong>
					<span>{pairs[name].definition}</span>
				</li>
			{/if}
		{/each}
	</ul>
{:else if !revealed}
	<p class="hint muted">
		{#if pickedName !== null}
			Ora scegli la definizione da collegare.
		{:else if pickedDefinition !== null}
			Ora scegli il termine da collegare.
		{:else}
			Tocca un termine e poi la sua definizione. Tocca di nuovo per staccare.
		{/if}
	</p>
{/if}

<style>
	.board {
		display: grid;
		/* The names column follows the width available, the definitions take whatever is left. */
		grid-template-columns: clamp(110px, 26%, 240px) minmax(0, 1fr);
		gap: 0.7rem;
		align-items: start;
	}

	.column {
		display: grid;
		gap: 0.6rem;
		align-content: start;
	}

	.chip,
	.card {
		position: relative;
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		width: 100%;
		text-align: left;
		border: 2px solid var(--line);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
		font-weight: 700;
		cursor: pointer;
		box-shadow: 0 3px 0 var(--line-strong);
		transition:
			transform var(--speed) var(--ease),
			border-color var(--speed) var(--ease),
			box-shadow var(--speed) var(--ease);
	}

	.chip {
		padding: 0.7rem 0.8rem;
		align-items: center;
		min-width: 0;
	}

	.card {
		padding: 0.75rem 0.9rem;
		font-weight: 600;
		line-height: 1.45;
	}

	.chip:hover:not(:disabled),
	.card:hover:not(:disabled) {
		transform: translateY(-2px);
	}

	.chip:disabled,
	.card:disabled {
		cursor: default;
	}

	.picked {
		border-color: var(--orange);
		box-shadow: 0 3px 0 var(--orange-dark);
		transform: translateY(-2px);
	}

	.linked {
		border-color: var(--link);
		box-shadow: 0 3px 0 var(--link);
	}

	.right {
		border-color: var(--green);
		background: var(--green-soft);
		box-shadow: 0 3px 0 var(--green-dark);
	}

	.wrong {
		border-color: var(--red);
		background: var(--red-soft);
		box-shadow: 0 3px 0 var(--red-dark);
	}

	.badge {
		flex: none;
		display: grid;
		place-items: center;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		color: #fff;
		font-size: 0.75rem;
		font-weight: 900;
	}

	.label {
		flex: 1;
	}

	.hint {
		margin-top: 0.75rem;
		font-size: 0.88rem;
		text-align: center;
	}

	.solution {
		margin: 0.9rem 0 0;
		padding: 0.85rem 1rem;
		list-style: none;
		display: grid;
		gap: 0.5rem;
		border-radius: var(--radius);
		background: var(--bg-tint);
		font-size: 0.9rem;
	}

	.solution li {
		display: grid;
		gap: 0.1rem;
	}

	.solution strong {
		color: var(--green-dark);
	}

	/* Too narrow for two columns: the names become a row of chips above the definitions. */
	@media (max-width: 560px) {
		.board {
			grid-template-columns: minmax(0, 1fr);
		}

		.names {
			display: flex;
			flex-wrap: wrap;
			gap: 0.5rem;
		}

		.names .chip {
			width: auto;
			flex: 0 1 auto;
		}
	}
</style>
