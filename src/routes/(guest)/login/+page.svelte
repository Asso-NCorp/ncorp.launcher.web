<script lang="ts">
    import { authClient } from "$src/lib/auth/client";
    import { onMount } from "svelte";

    onMount(async () => {
        await authClient.signIn.oauth2({
            providerId: "nlan",
        });
    });
</script>

<div>
    <span>Redirection vers la page de connexion...</span>
</div>
