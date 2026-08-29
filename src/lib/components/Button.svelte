<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'primary' | 'blue' | 'yellow' | 'danger' | 'ghost';

	let {
		variant = 'primary',
		size = 'md',
		href = undefined,
		type = 'button',
		disabled = false,
		full = false,
		onclick = undefined,
		children,
		...rest
	}: {
		variant?: Variant;
		size?: 'sm' | 'md' | 'lg';
		href?: string;
		type?: 'button' | 'submit';
		disabled?: boolean;
		full?: boolean;
		onclick?: (event: MouseEvent) => void;
		children: Snippet;
		[key: string]: unknown;
	} = $props();
</script>

{#if href}
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the caller resolves the href -->
	<a class="btn {variant} {size}" class:full {href} {...rest}>{@render children()}</a>
{:else}
	<button class="btn {variant} {size}" class:full {type} {disabled} {onclick} {...rest}>
		{@render children()}
	</button>
{/if}

<style>
	.btn {
		--btn-bg: var(--orange);
		--btn-edge: var(--orange-dark);
		--btn-ink: #fff;

		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		border: none;
		border-radius: 16px;
		background: var(--btn-bg);
		color: var(--btn-ink);
		font-weight: 800;
		letter-spacing: 0.01em;
		text-decoration: none;
		cursor: pointer;
		box-shadow: 0 var(--depth) 0 var(--btn-edge);
		transition:
			transform var(--speed) var(--ease),
			box-shadow var(--speed) var(--ease),
			filter var(--speed) var(--ease);
	}

	.btn:hover:not(:disabled) {
		filter: brightness(1.04);
	}

	.btn:active:not(:disabled) {
		transform: translateY(var(--depth));
		box-shadow: 0 0 0 var(--btn-edge);
	}

	.btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.sm {
		padding: 0.45rem 0.85rem;
		font-size: 0.85rem;
	}

	.md {
		padding: 0.7rem 1.3rem;
		font-size: 1rem;
	}

	.lg {
		padding: 0.95rem 1.9rem;
		font-size: 1.1rem;
	}

	.full {
		width: 100%;
	}

	.blue {
		--btn-bg: var(--blue);
		--btn-edge: var(--blue-dark);
	}

	.yellow {
		--btn-bg: var(--yellow);
		--btn-edge: var(--yellow-dark);
		--btn-ink: #543f00;
	}

	.danger {
		--btn-bg: var(--red);
		--btn-edge: var(--red-dark);
	}

	.ghost {
		--btn-bg: var(--surface);
		--btn-edge: var(--line-strong);
		--btn-ink: var(--ink-soft);
		border: 2px solid var(--line);
	}
</style>
