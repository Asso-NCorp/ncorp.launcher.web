<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/state";
    import type { User } from "$src/lib/auth/client";
    import type { PageData } from "../profile/$types";

    let { data }: { data: PageData } = $props();
    const user = page.data["user"] as User;
</script>

<main class="flex h-full flex-col space-y-4">
    <h1 class="text-2xl font-bold">Profile</h1>
    <p class="text-muted-foreground">Welcome, {user.name}!</p>
</main>
