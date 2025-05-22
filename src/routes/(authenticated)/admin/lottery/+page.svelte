<script lang="ts">
    import { page } from "$app/state";
    import Button from "$src/lib/components/ui/button/button.svelte";
    import Input from "$src/lib/components/ui/input/input.svelte";
    import FortuneWheel from "$src/lib/components/custom/FortuneWheel.svelte";
    import * as Avatar from "$lib/components/ui/avatar/index.js";
    import type { PageData } from "./$types";
    import clsx from "clsx";

    const pageData = page.data as PageData;

    // Make initialUserDisplayNames mutable and initialize with a copy
    let initialUserDisplayNames: { id: string; name: string; role: string }[] = (pageData.userDisplayNames || []).map(
        (user: { role: string; name: string; id: string }) => ({
            id: user.id,
            name: user.name,
            role: user.role,
        }),
    );
    let usernames = $state([...initialUserDisplayNames]);
    let winner: string | null = $state(null);
    let isWheelSpinning = $state(false);

    // Reference to the wheel component
    let wheelComponent: FortuneWheel;

    // Logo path
    const logoImagePath = "/logo_small.png";

    let newUsername: string = $state("");

    // Derived state for button disabled status
    let isAddButtonDisabled = $derived(isWheelSpinning || !newUsername.trim());

    function addUsername() {
        const trimmedName = newUsername.trim();
        if (trimmedName && !usernames.some((u) => u.name === trimmedName)) {
            // MODIFIED: Add to the beginning of the array
            usernames = [{ id: crypto.randomUUID(), name: trimmedName, role: "user" }, ...usernames];
            newUsername = ""; // Clear input
        }
    }

    function deleteUsername(indexToDelete: number) {
        if (indexToDelete >= 0 && indexToDelete < usernames.length) {
            usernames = usernames.filter((_, index) => index !== indexToDelete);
        }
    }

    function spinWheel() {
        if (wheelComponent) {
            wheelComponent.spinWheel();
        }
    }

    function resetLottery() {
        // Reset everything for the wheel
        if (winner && !initialUserDisplayNames.some((u) => u.name === winner)) {
            initialUserDisplayNames.push({ id: crypto.randomUUID(), name: winner, role: "user" }); // Add with a default role
        }

        usernames = [...initialUserDisplayNames];
        winner = null;

        // Reset the wheel component
        if (wheelComponent) {
            wheelComponent.resetWheel();
        }

        newUsername = ""; // Clear input on reset
    }

    // Handle wheel events
    function handleWinner(event: CustomEvent<{ name: string }>) {
        const winningUserName = event.detail.name;

        winner = winningUserName; // Update the page's display state for the winner

        if (winningUserName) {
            const originalLength = usernames.length;
            const filteredUsernames = usernames.filter((u) => u.name !== winningUserName);

            if (filteredUsernames.length < originalLength) {
                usernames = filteredUsernames; // MODIFIED: Reassign to $state variable
            } else {
                console.warn(`Winner '${winningUserName}' not found in usernames list or list was already filtered.`);
            }
        }
    }

    function handleError(event: CustomEvent<{ message: string }>) {
        console.error("FortuneWheel error:", event.detail.message);
        isWheelSpinning = false; // ADDED: Reset spinning state on error
    }
</script>

<div
    class="container mx-auto flex flex-col items-center gap-6 bg-background p-4 text-foreground lg:flex-row lg:items-start">
    <!-- Left Side: Game Board and Controls -->
    <div class="flex w-full flex-col items-center lg:w-1/2 lg:pr-4">
        <h1 class="text-4xl font-bold text-primary">Tirage au Sort</h1>

        <!-- Board Container - Only shows the wheel -->
        <div class="mt-6 w-full max-w-md">
            <!-- FortuneWheel Component -->
            <FortuneWheel
                bind:this={wheelComponent}
                users={usernames}
                logoPath={logoImagePath}
                onwinner={handleWinner}
                onerror={handleError}
                onspin={() => (isWheelSpinning = true)}
                onspinComplete={() => (isWheelSpinning = false)} />
        </div>
        <!-- Controls: Spin and Reset buttons -->
        <div class="controls mt-6 flex flex-wrap justify-center gap-4">
            <Button
                onclick={spinWheel}
                disabled={isWheelSpinning || usernames.length === 0}
                class="flex-grow sm:flex-grow-0">
                Tourner la Roue
            </Button>
            <Button
                variant="destructive"
                onclick={resetLottery}
                disabled={isWheelSpinning}
                class="flex-grow sm:flex-grow-0">
                Réinitialiser la loterie
            </Button>
        </div>
    </div>

    <!-- Right Side: User Management -->
    <div class="mt-6 flex w-full flex-col items-center lg:mt-0 lg:w-1/2 lg:pl-4 lg:pt-12">
        <!-- Section pour ajouter un utilisateur -->
        <div class="add-user-section w-full max-w-md">
            <h2 class="mb-3 text-2xl font-semibold text-secondary-foreground">Ajouter un utilisateur</h2>
            <div class="flex gap-2">
                <Input
                    type="text"
                    placeholder="Nom d'utilisateur"
                    bind:value={newUsername}
                    onkeypress={(e) => e.key === "Enter" && !isWheelSpinning && addUsername()}
                    disabled={isWheelSpinning}
                    class="flex-grow" />
                <Button variant="outline" onclick={addUsername} disabled={isAddButtonDisabled}>Ajouter</Button>
            </div>
        </div>

        <div class="mt-8 w-full max-w-md text-center">
            <h2 class="mb-4 text-2xl font-semibold text-secondary-foreground">Utilisateurs restants :</h2>
            {#if usernames.length > 0}
                <ul class="max-h-[800px] overflow-y-auto rounded-lg border border-border bg-card p-4 shadow">
                    {#each usernames as user, i (user.name)}
                        <li
                            class={clsx(
                                "flex items-center justify-between p-3 text-lg text-card-foreground",
                                i < usernames.length - 1 && "border-b border-border",
                                user.role === "admin" && "text-primary",
                            )}>
                            <div class="flex items-center gap-2">
                                <Avatar.Root class="h-8 w-8 ring-primary">
                                    <Avatar.Image src="/api/avatars/{user.id}" alt={user.name} />
                                    <Avatar.Fallback>{user.name?.charAt(0)}{user.name?.charAt(1)}</Avatar.Fallback>
                                </Avatar.Root>
                                <span>{user.name}</span>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                onclick={() => deleteUsername(i)}
                                disabled={isWheelSpinning}
                                class="text-destructive hover:bg-destructive/80 hover:text-destructive-foreground">
                                Supprimer
                            </Button>
                        </li>
                    {/each}
                </ul>
            {:else}
                <p class="text-muted-foreground">Plus d'utilisateurs dans la liste.</p>
            {/if}
        </div>
    </div>
</div>
