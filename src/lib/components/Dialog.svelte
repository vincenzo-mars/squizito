<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		title,
		size = 'sm',
		onclose = undefined,
		children,
		actions
	}: {
		open?: boolean;
		title: string;
		size?: 'sm' | 'lg';
		onclose?: () => void;
		children: Snippet;
		actions: Snippet;
	} = $props();

	let element = $state<HTMLDialogElement>();

	$effect(() => {
		if (!element) return;
		if (open && !element.open) element.showModal();
		if (!open && element.open) element.close();
	});
</script>

<dialog
	bind:this={element}
	class={size}
	onclose={() => {
		open = false;
		onclose?.();
	}}
>
	<h2>{title}</h2>
	<div class="body">{@render children()}</div>
	<div class="actions">{@render actions()}</div>
</dialog>

<style>
	dialog {
		border: 2px solid var(--line);
		border-radius: var(--radius-lg);
		padding: clamp(1.25rem, 3vw, 1.75rem);
		width: min(420px, calc(100vw - 2.5rem));
		max-height: calc(100vh - 3rem);
		background: var(--surface);
		color: var(--ink);
		box-shadow: 0 24px 60px rgb(43 52 69 / 0.25);
	}

	dialog.lg {
		width: min(620px, calc(100vw - 2.5rem));
	}

	dialog::backdrop {
		background: rgb(43 52 69 / 0.35);
		backdrop-filter: blur(2px);
	}

	dialog[open] {
		animation: rise 240ms var(--ease);
	}

	h2 {
		font-size: 1.2rem;
		margin-bottom: 0.75rem;
	}

	.body {
		display: grid;
		gap: 0.75rem;
		margin-bottom: 1.25rem;
		overflow-y: auto;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.6rem;
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(12px) scale(0.97);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
</style>
