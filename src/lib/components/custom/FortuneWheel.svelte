<script lang="ts">
    import { browser } from "$app/environment";
    import { onMount, onDestroy } from "svelte";
    import Progress from "$lib/components/ui/progress/progress.svelte";
    import { fade, scale } from "svelte/transition";

    // Props
    interface $$Props {
        users?: { name: string; role: string }[];
        logoPath?: string;
        onspin?: () => void;
        onwinner?: (event: CustomEvent<{ name: string }>) => void;
        onspinComplete?: () => void;
        onerror?: (event: CustomEvent<{ message: string }>) => void;
        winnerGifFiles?: string[]; // <-- Add this prop
    }
    let {
        users = [],
        logoPath = "/logo_small.png",
        onspin,
        onwinner,
        onspinComplete,
        onerror,
        winnerGifFiles = [],
    }: $$Props = $props();

    let selectedUser: string | null = $state(null);
    let spinning = $state(false);
    let winner: string | null = $state(null);
    let logoImage: HTMLImageElement;
    let logoImageLoaded = $state(false);
    const LOGO_SIZE = 80;
    let showWinnerAnimation = $state(false);
    let winnerAnimationVisible = $state(true);
    let winnerAnimationTimeoutId: any;
    // Progress bar for winner animation
    let winnerProgressPercent = $state(0);
    let progressIntervalId: any;
    // Winner GIF management
    let availableWinnerGifs = $state<string[]>([...winnerGifFiles]); // <-- Initialize with prop
    let usedWinnerGifs = $state<string[]>([]);
    let currentWinnerGif = $state<string | null>(null);
    let canvasEl: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let currentAngle = 0;
    let animationFrameId: number;
    let wheelContainerEl: HTMLDivElement;
    let highlightedSegmentIndex = -1;
    let isHighlightBlinkOn = $state(false);
    const POINTER_ANGLE = -Math.PI / 2;
    const segmentColors = ["#60A5FA", "#F87171", "#4ADE80", "#FACC15", "#F472B6", "#818CF8"];
    const SPIN_DURATION = 6000; // 6 secondes (ajuste ici pour plus ou moins long)
    const EXTRA_ROTATIONS = 6;
    const WINNER_ANNOUNCEMENT_DURATION = 5000; // 5 seconds for the winner announcement display
    const FLICKER_INTERVAL = 150; // Interval for flickering effect in ms
    const FLICKER_DURATION = 2000; // Total duration for flickering effect in ms

    // Easing quintic-out (plus progressif et smooth)
    function easeOutQuint(x: number) {
        return 1 - Math.pow(1 - x, 5);
    }

    let initialAngleAtSpinStart = 0;
    let targetAngleValue = 0;
    let spinStartTime = 0;

    function drawWheel(currentUsersList: { name: string; role: string }[]) {
        if (!ctx || !canvasEl) return;
        const numSegments = currentUsersList.length;
        const centerX = canvasEl.width / 2;
        const centerY = canvasEl.height / 2;
        const radius = Math.min(centerX, centerY) * 0.9;
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

        if (numSegments === 0) {
            ctx.textAlign = "center";
            ctx.font = "16px Rubik, sans-serif";
            ctx.fillStyle = "#888";
            ctx.fillText("Aucun utilisateur à afficher", centerX, centerY);
            drawPointer(centerX, centerY, radius);
            return;
        }

        const segmentAngle = (2 * Math.PI) / numSegments;
        for (let i = 0; i < numSegments; i++) {
            const startAngle = currentAngle + i * segmentAngle;
            const endAngle = startAngle + segmentAngle;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();

            ctx.fillStyle =
                i === highlightedSegmentIndex && isHighlightBlinkOn
                    ? "#FFD700"
                    : segmentColors[i % segmentColors.length];
            ctx.fill();
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.save();
            ctx.translate(centerX, centerY);
            const textAngle = currentAngle + i * segmentAngle + segmentAngle / 2;
            ctx.rotate(textAngle);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#fff";
            ctx.font = "bold 16px Rubik, sans-serif";
            const text =
                currentUsersList[i].name.length > 12
                    ? currentUsersList[i].name.substring(0, 10) + "..."
                    : currentUsersList[i].name;
            const textPlacementRadius = radius * 0.67;
            let normalizedVisualAngle = textAngle % (2 * Math.PI);
            if (normalizedVisualAngle < 0) normalizedVisualAngle += 2 * Math.PI;
            if (normalizedVisualAngle > Math.PI / 2 && normalizedVisualAngle < (3 * Math.PI) / 2) {
                ctx.rotate(Math.PI);
                ctx.fillText(text, -textPlacementRadius, 0);
            } else {
                ctx.fillText(text, textPlacementRadius, 0);
            }
            ctx.restore();
        }
        // Logo
        if (logoImageLoaded && logoImage.complete && logoImage.naturalHeight !== 0 && logoImage.naturalWidth !== 0) {
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(currentAngle);
            const logoMaxDim = LOGO_SIZE;
            const imgNaturalWidth = logoImage.naturalWidth;
            const imgNaturalHeight = logoImage.naturalHeight;
            let drawWidth, drawHeight;
            if (imgNaturalWidth > imgNaturalHeight) {
                drawWidth = logoMaxDim;
                drawHeight = (imgNaturalHeight / imgNaturalWidth) * logoMaxDim;
            } else {
                drawHeight = logoMaxDim;
                drawWidth = (imgNaturalWidth / imgNaturalHeight) * logoMaxDim;
            }
            if (isNaN(drawWidth) || isNaN(drawHeight) || drawWidth <= 0 || drawHeight <= 0) {
                drawWidth = logoMaxDim;
                drawHeight = logoMaxDim;
            }
            ctx.drawImage(logoImage, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
            ctx.restore();
        }
        drawPointer(centerX, centerY, radius);
    }

    function drawPointer(centerX: number, centerY: number, radius: number) {
        if (!ctx) return;
        const pointerSize = 26;
        const pointerTipY = centerY - radius - 5;
        const pointerBaseY = pointerTipY - pointerSize * 1.5;
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = "#222";
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX - pointerSize / 2, pointerBaseY);
        ctx.lineTo(centerX + pointerSize / 2, pointerBaseY);
        ctx.lineTo(centerX, pointerTipY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    function spinWheelAnimation(timestamp: number) {
        try {
            if (!spinStartTime) spinStartTime = timestamp;
            const elapsed = timestamp - spinStartTime;
            let progress = Math.min(elapsed / SPIN_DURATION, 1);

            // Easing très smooth
            const easedProgress = easeOutQuint(progress);

            currentAngle = initialAngleAtSpinStart + (targetAngleValue - initialAngleAtSpinStart) * easedProgress;
            drawWheel(users);

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(spinWheelAnimation);
            } else {
                currentAngle = targetAngleValue;
                drawWheel(users);
                const idx = getWinnerIndexFromAngle(currentAngle);
                highlightWinnerSegment(idx, () => finalizeSelection(idx));
            }
        } catch (error) {
            spinning = false;
            highlightedSegmentIndex = -1;
            isHighlightBlinkOn = false;
            winner = null;
            selectedUser = "Erreur pendant l'animation";
            onerror?.(new CustomEvent("error", { detail: { message: "Erreur animation" } }));
            animationFrameId && cancelAnimationFrame(animationFrameId);
            drawWheel(users);
        }
    }

    function getWinnerIndexFromAngle(wheelAngle: number): number {
        if (users.length === 0) return -1;
        const segmentAngle = (2 * Math.PI) / users.length;
        let pointerOnWheel = (POINTER_ANGLE - wheelAngle) % (2 * Math.PI);
        if (pointerOnWheel < 0) pointerOnWheel += 2 * Math.PI;
        return Math.floor(pointerOnWheel / segmentAngle);
    }

    export function spinWheel() {
        if (users.length === 0) {
            selectedUser = "Plus d'utilisateurs !";
            winner = null;
            spinning = false;
            highlightedSegmentIndex = -1;
            isHighlightBlinkOn = false;
            return;
        }
        spinning = true;
        winner = null;
        selectedUser = null;
        highlightedSegmentIndex = -1;
        isHighlightBlinkOn = false;
        onspin?.();

        initialAngleAtSpinStart = currentAngle;
        const winnerIndex = Math.floor(Math.random() * users.length);
        const segmentAngle = (2 * Math.PI) / users.length;
        let finalOrientation = POINTER_ANGLE - (winnerIndex * segmentAngle + segmentAngle / 2);
        targetAngleValue = initialAngleAtSpinStart - (initialAngleAtSpinStart % (2 * Math.PI));
        targetAngleValue += EXTRA_ROTATIONS * 2 * Math.PI;
        targetAngleValue += (finalOrientation - (targetAngleValue % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        if (targetAngleValue <= initialAngleAtSpinStart) targetAngleValue += 2 * Math.PI;
        targetAngleValue = Math.round(targetAngleValue * 1000) / 1000;

        spinStartTime = 0;
        animationFrameId && cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(spinWheelAnimation);
    }

    function highlightWinnerSegment(idx: number, callback: () => void) {
        if (idx < 0 || idx >= users.length) {
            highlightedSegmentIndex = -1;
            isHighlightBlinkOn = false;
            callback();
            return;
        }
        highlightedSegmentIndex = idx;
        let blinkCount = 0,
            maxBlinks = 6,
            blinkInterval = 150;
        function blink() {
            isHighlightBlinkOn = !isHighlightBlinkOn;
            drawWheel(users);
            blinkCount++;
            if (blinkCount < maxBlinks) {
                setTimeout(blink, blinkInterval);
            } else {
                highlightedSegmentIndex = -1;
                isHighlightBlinkOn = false;
                drawWheel(users);
                setTimeout(callback, 50);
            }
        }
        blink();
    }
    function getRandomWinnerGif(): string {
        // If all GIFs have been used, reset the pool
        if (availableWinnerGifs.length === 0) {
            availableWinnerGifs = [...usedWinnerGifs];
            usedWinnerGifs = [];
            console.log("All winner GIFs shown, resetting pool.");
        }

        if (availableWinnerGifs.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableWinnerGifs.length);
            const selectedGif = availableWinnerGifs[randomIndex];

            // Move from available to used
            availableWinnerGifs.splice(randomIndex, 1);
            usedWinnerGifs.push(selectedGif);

            return selectedGif;
        }
        return ""; // Should not be reached if logic above is correct
    }

    // Export function to reset GIF pool manually if needed
    export function resetWinnerGifPool() {
        if (winnerGifFiles && winnerGifFiles.length > 0) {
            availableWinnerGifs = [...winnerGifFiles];
        } else {
            availableWinnerGifs = []; // Or some default if no files passed
        }
        usedWinnerGifs = [];
        currentWinnerGif = null;
        console.log("Winner GIF pool explicitly reset.");
    }
    function startWinnerAnimation() {
        showWinnerAnimation = true;
        winnerAnimationVisible = true;
        winnerProgressPercent = 0;

        // Select a random winner GIF
        currentWinnerGif = getRandomWinnerGif();

        if (winnerAnimationTimeoutId) clearTimeout(winnerAnimationTimeoutId);
        if (progressIntervalId) clearInterval(progressIntervalId);

        let flickerCount = 0,
            maxFlickers = 12,
            flickerInterval = 200;

        function flicker() {
            winnerAnimationVisible = !winnerAnimationVisible;
            flickerCount++;
            if (flickerCount < maxFlickers) {
                winnerAnimationTimeoutId = setTimeout(flicker, flickerInterval);
            } else {
                winnerAnimationVisible = true;

                // Start progress bar animation after flickering ends
                const totalDisplayTime = 5000; // 5 seconds
                const progressUpdateInterval = 50; // Update every 50ms for smooth animation
                const progressStep = (100 / totalDisplayTime) * progressUpdateInterval;

                progressIntervalId = setInterval(() => {
                    winnerProgressPercent += progressStep;
                    if (winnerProgressPercent >= 100) {
                        winnerProgressPercent = 100;
                        clearInterval(progressIntervalId);
                    }
                }, progressUpdateInterval);

                winnerAnimationTimeoutId = setTimeout(() => {
                    showWinnerAnimation = false;
                    currentWinnerGif = null; // Clear the GIF when animation ends
                    winnerProgressPercent = 0;
                    clearInterval(progressIntervalId);
                }, totalDisplayTime);
            }
        }
        winnerAnimationTimeoutId = setTimeout(flicker, 500);
    }

    function finalizeSelection(idx: number) {
        if (idx >= 0 && idx < users.length) {
            winner = users[idx].name;
            startWinnerAnimation();
            onwinner?.(new CustomEvent("winner", { detail: { name: winner } }));
            spinning = false;
            highlightedSegmentIndex = -1;
            isHighlightBlinkOn = false;
            drawWheel(users);
            onspinComplete?.();
        } else {
            winner = null;
            spinning = false;
            highlightedSegmentIndex = -1;
            isHighlightBlinkOn = false;
            drawWheel(users);
            onspinComplete?.();
        }
    }
    export function resetWheel() {
        spinning = false;
        winner = null;
        selectedUser = null;
        showWinnerAnimation = false;
        winnerAnimationVisible = true;
        currentWinnerGif = null;
        winnerProgressPercent = 0;
        winnerAnimationTimeoutId && clearTimeout(winnerAnimationTimeoutId);
        progressIntervalId && clearInterval(progressIntervalId);
        currentAngle = 0;
        animationFrameId && cancelAnimationFrame(animationFrameId);
        highlightedSegmentIndex = -1;
        isHighlightBlinkOn = false;
        drawWheel(users);
    }
    function setupCanvasDimensions() {
        if (canvasEl && wheelContainerEl) {
            const containerWidth = wheelContainerEl.clientWidth;
            let size;
            if (window.innerWidth >= 1024) {
                size = containerWidth * 0.95;
            } else {
                const containerHeight = wheelContainerEl.clientHeight;
                size = Math.min(containerWidth, containerHeight) * 0.95;
            }
            canvasEl.width = size * 1.5;
            canvasEl.height = size * 1.5;
            drawWheel(users);
        }
    }
    function shuffle(array: any[]) {
        let m = array.length,
            t,
            i;
        while (m) {
            i = Math.floor(Math.random() * m--);
            t = array[m];
            array[m] = array[i];
            array[i] = t;
        }
        return array;
    }

    $effect(() => {
        if (winnerGifFiles && winnerGifFiles.length > 0) {
            availableWinnerGifs = [...winnerGifFiles];
            usedWinnerGifs = []; // Reset used GIFs if the prop changes
        }
    });

    onMount(() => {
        if (browser) {
            users = shuffle([...users]);
            const canvas = canvasEl;
            if (!canvas) return;
            const context = canvas.getContext("2d");
            if (!context) return;
            ctx = context;
            setupCanvasDimensions();
            window.addEventListener("resize", setupCanvasDimensions);
            logoImage = new Image();
            logoImage.src = logoPath;
            logoImage.onload = () => {
                logoImageLoaded = true;
                ctx && drawWheel(users);
            };
            logoImage.onerror = () => {};
        }
    });
    onDestroy(() => {
        animationFrameId && cancelAnimationFrame(animationFrameId);
        winnerAnimationTimeoutId && clearTimeout(winnerAnimationTimeoutId);
        progressIntervalId && clearInterval(progressIntervalId);
        if (browser) window.removeEventListener("resize", setupCanvasDimensions);
    });
</script>

<div
    bind:this={wheelContainerEl}
    class="wheel-container relative flex w-full max-w-md flex-col items-center justify-center lg:h-auto lg:flex-grow">
    <canvas bind:this={canvasEl} class="rounded-full"></canvas>
</div>

{#if showWinnerAnimation && winner}
    <div
        transition:fade={{ duration: 300 }}
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div
            class="scale-110 transform text-center transition-all duration-300"
            class:opacity-100={winnerAnimationVisible}
            class:opacity-20={!winnerAnimationVisible}>
            <img src="/img/cat_vibe.gif" alt="Cat Vibe" class="mx-auto mb-4 h-52 w-auto rounded-full shadow-lg" />
            <div class="mb-4 text-6xl font-bold text-white drop-shadow-2xl md:text-8xl">🎉 GAGNANT ! 🎉</div>
            <div
                class="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-4xl font-bold text-transparent text-yellow-400 drop-shadow-xl md:text-6xl">
                {winner}
            </div>
            <div class="mt-8 text-xl text-white/80">Félicitations ! 🎊</div>
            {#if currentWinnerGif}
                <img
                    src={`/img/winners/${currentWinnerGif}`}
                    alt="Winner Celebration"
                    class="mx-auto mt-4 h-96 w-auto" />
            {/if}

            <div class="mx-auto mt-6 w-full max-w-md">
                <Progress value={winnerProgressPercent} max={100} class="h-1" />
            </div>
        </div>
    </div>
{/if}

<div
    class="results-section mt-6 flex min-h-[80px] w-full max-w-md flex-col items-center justify-center rounded-lg border border-border bg-card p-4 text-center shadow-lg">
    {#if spinning || highlightedSegmentIndex !== -1}
        <div class="text-2xl text-muted-foreground">Tirage en cours...</div>
    {:else if winner}
        <div class="text-2xl text-success">
            Gagnant : <span class="text-3xl font-bold text-primary">{winner}</span>
        </div>
    {:else if selectedUser}
        <div class="text-4xl text-muted-foreground">{selectedUser}</div>
    {:else}
        <div class="text-4xl text-muted-foreground">Prêt à tourner !</div>
    {/if}
</div>

<style>
    /* ... existing styles ... */
    .flicker-text {
        animation: flicker 1.5s infinite alternate; /* Simplified for example, use FLICKER_INTERVAL based if needed */
        text-shadow:
            0 0 7px #fff,
            0 0 10px #fff,
            0 0 21px #fff,
            0 0 42px #0fa,
            0 0 82px #0fa,
            0 0 92px #0fa,
            0 0 102px #0fa,
            0 0 151px #0fa;
    }

    @keyframes flicker {
        0%,
        18%,
        22%,
        25%,
        53%,
        57%,
        100% {
            opacity: 1;
        }
        20%,
        24%,
        55% {
            opacity: 0.4;
        }
    }
</style>
