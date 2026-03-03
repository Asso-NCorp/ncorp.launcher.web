<script lang="ts">
	import { onNavigate } from '$app/navigation';

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		// Skip view transition for same-route navigations (e.g. switching DMs)
		if (navigation.from?.route.id === navigation.to?.route.id) return;

		return new Promise((resolve) => {
			document.startViewTransition(() => {
				resolve();
			});
		});
	});
</script>

<slot />

<style global>
	::view-transition {
		animation: none;
	}

	::view-transition-old(root) {
		animation: none;
	}

	::view-transition-new(root) {
		animation: none;
	}

	/* Keep header transition smooth */
	::view-transition-old(header) {
		animation: inherit;
	}

	::view-transition-new(header) {
		animation: inherit;
	}
</style>
