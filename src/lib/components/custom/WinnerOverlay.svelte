<script lang="ts">
    import Progress from "$lib/components/ui/progress/progress.svelte";
    import { fade } from "svelte/transition";
    import { onDestroy } from "svelte";

    // Props
    interface $$Props {
        // Props for declarative usage (optional)
        show?: boolean;
        winner?: string | null;
        visible?: boolean;
        progressPercent?: number;
        currentGif?: string | null;
    }

    let {
        show: propShow = false,
        winner: propWinner = null,
        visible: propVisible = true,
        progressPercent: propProgressPercent = 0,
        currentGif: propCurrentGif = null,
    }: $$Props = $props();

    // Internal state for imperative control
    let internalShow = $state(false);
    let internalWinner = $state<string | null>(null);
    let internalVisible = $state(true); // Controls opacity during flicker
    let internalProgressPercent = $state(0);
    let internalCurrentGif = $state<string | null>(null);
    let internalPrizeText = $state<string | null>(null); // ADDED: State for prize text

    let winnerAnimationTimeoutId: any;
    let progressIntervalId: any;

    // Determine which state to use (prop-based or internal state from imperative call)
    const isActive = $derived(internalShow || propShow);
    const displayWinner = $derived(internalShow ? internalWinner : propWinner);
    const displayVisible = $derived(internalShow ? internalVisible : propVisible);
    const displayProgress = $derived(internalShow ? internalProgressPercent : propProgressPercent);
    const displayGif = $derived(internalShow ? internalCurrentGif : propCurrentGif);
    const displayPrizeText = $derived(internalShow ? internalPrizeText : null); // ADDED: Derived state for prize text

    // MODIFIED: Added prizeText parameter
    export function showWinner(
        name: string,
        gifUrl: string | null,
        blinksCount: number = 12,
        duration: number = 5000,
        prizeText: string | null = null,
    ) {
        if (winnerAnimationTimeoutId) clearTimeout(winnerAnimationTimeoutId);
        if (progressIntervalId) clearInterval(progressIntervalId);

        internalWinner = name;
        internalShow = true;
        internalVisible = true; // Start as fully visible before flickering
        internalProgressPercent = 0;
        internalCurrentGif = gifUrl; // Use passed gifUrl
        internalPrizeText = prizeText; // ADDED: Set prize text

        let flickerCount = 0;
        const flickerInterval = 150; // ms

        function flicker() {
            internalVisible = !internalVisible;
            flickerCount++;
            if (flickerCount < blinksCount) {
                winnerAnimationTimeoutId = setTimeout(flicker, flickerInterval);
            } else {
                internalVisible = true; // Ensure it's visible after flickering
                startProgressAnimation(duration);
            }
        }
        // Start flickering after a short delay to allow the component to render if it was hidden
        winnerAnimationTimeoutId = setTimeout(flicker, 100);
    }

    function startProgressAnimation(duration: number) {
        const progressUpdateInterval = 50; // Update every 50ms
        const totalUpdates = duration / progressUpdateInterval;
        const progressStep = 100 / totalUpdates;

        progressIntervalId = setInterval(() => {
            internalProgressPercent += progressStep;
            if (internalProgressPercent >= 100) {
                internalProgressPercent = 100;
                clearInterval(progressIntervalId);
            }
        }, progressUpdateInterval);

        // Set a timeout to hide the overlay after the total duration
        winnerAnimationTimeoutId = setTimeout(() => {
            hideWinner();
        }, duration);
    }

    export function hideWinner() {
        internalShow = false;
        internalWinner = null;
        internalCurrentGif = null; // Ensure currentGif is cleared
        internalPrizeText = null; // ADDED: Clear prize text
        internalProgressPercent = 0;
        internalVisible = true;
        if (winnerAnimationTimeoutId) clearTimeout(winnerAnimationTimeoutId);
        if (progressIntervalId) clearInterval(progressIntervalId);
    }

    onDestroy(() => {
        if (winnerAnimationTimeoutId) clearTimeout(winnerAnimationTimeoutId);
        if (progressIntervalId) clearInterval(progressIntervalId);
    });
</script>

{#if isActive && displayWinner}
    <div
        transition:fade={{ duration: 300 }}
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div
            class="scale-110 transform text-center transition-all duration-300"
            class:opacity-100={displayVisible}
            class:opacity-20={!displayVisible}>
            <img src="/img/cat_vibe.gif" alt="Cat Vibe" class="mx-auto mb-4 h-52 w-auto rounded-full shadow-lg" />
            <div class="mb-4 text-6xl font-bold text-white drop-shadow-2xl md:text-8xl">🎉 GAGNANT ! 🎉</div>
            <div
                class="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-4xl font-bold text-transparent text-yellow-400 drop-shadow-xl md:text-6xl">
                {displayWinner}
            </div>
            {#if displayPrizeText}
                <div class="mt-4 text-4xl font-semibold text-white drop-shadow-lg md:text-5xl">
                    GAIN : <span class="text-yellow-300">{displayPrizeText}</span>
                </div>
            {/if}
            <div class="mt-8 text-xl text-white/80">Félicitations ! 🎊</div>
            {#if displayGif}
                <img src={`/img/winners/${displayGif}`} alt="Winner Celebration" class="mx-auto mt-4 h-96 w-auto" />
            {/if}

            <div class="mx-auto mt-6 w-full max-w-md">
                <Progress value={displayProgress} max={100} class="h-1" />
            </div>
        </div>
    </div>
{/if}
