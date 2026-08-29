<script lang="ts">
	let {
		checked = $bindable(false),
		label,
		hint = undefined
	}: { checked?: boolean; label: string; hint?: string } = $props();
</script>

<label class="toggle">
	<input type="checkbox" bind:checked />
	<span class="track"><span class="thumb"></span></span>
	<span class="text">
		<span class="label">{label}</span>
		{#if hint}<span class="hint">{hint}</span>{/if}
	</span>
</label>

<style>
	.toggle {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		padding: 0.4rem 0;
	}

	input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.track {
		flex: none;
		width: 52px;
		height: 30px;
		border-radius: 999px;
		background: var(--line-strong);
		padding: 3px;
		transition: background var(--speed) var(--ease);
	}

	.thumb {
		display: block;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: #fff;
		box-shadow: 0 2px 4px rgb(43 52 69 / 0.25);
		transition: transform var(--speed) var(--ease);
	}

	input:checked + .track {
		background: var(--orange);
	}

	input:checked + .track .thumb {
		transform: translateX(22px);
	}

	input:focus-visible + .track {
		outline: 3px solid var(--orange);
		outline-offset: 3px;
	}

	.text {
		display: grid;
	}

	.label {
		font-weight: 700;
	}

	.hint {
		font-size: 0.82rem;
		color: var(--ink-soft);
	}
</style>
