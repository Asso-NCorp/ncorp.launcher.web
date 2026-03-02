<script lang="ts">
    import { browser } from "$app/environment";
    import { onMount, onDestroy } from "svelte";
    import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
    import {
        liveServerConnection, // Corrected: Was liveAgentConnection, but code uses liveServerConnection
    } from "$src/lib/states/live-server.svelte";
    import Input from "$lib/components/ui/input/input.svelte"; // Added Input import
    import { Label } from "../ui/label";

    // Props
    interface $$Props {
        users?: { name: string; role: string }[];
        logoPath?: string;
        onspin?: () => void;
        onwinner?: (event: CustomEvent<{ name: string }>) => void;
        onspinComplete?: () => void;
        onerror?: (event: CustomEvent<{ message: string }>) => void;
        winnerGifFiles?: string[];
        prizeToWinText?: string; // ADDED: prizeToWinText prop
    }
    let {
        users = [],
        logoPath = "/logo_small.png",
        onspin,
        onwinner,
        onspinComplete,
        onerror,
        winnerGifFiles = [],
        prizeToWinText = $bindable(""),
    }: $$Props = $props();

    let shouldBroadcastWin = $state(true);
    let selectedUser: string | null = $state(null);
    let spinning = $state(false);
    let winner: string | null = $state(null); // Still needed to display winner text below wheel
    let logoImage: HTMLImageElement;
    let logoImageLoaded = $state(false);
    const LOGO_SIZE = 90;

    let canvasEl: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let currentAngle = 0;
    let animationFrameId: number;
    let wheelContainerEl: HTMLDivElement;
    let highlightedSegmentIndex = -1;
    let isHighlightBlinkOn = $state(false);
    const POINTER_ANGLE = -Math.PI / 2;
    
    // Enhanced color palette with gradients (base and darker shade for 3D effect)
    const segmentColors = [
        { base: "#3B82F6", dark: "#1D4ED8", light: "#60A5FA" },  // Blue
        { base: "#EF4444", dark: "#B91C1C", light: "#F87171" },  // Red
        { base: "#22C55E", dark: "#15803D", light: "#4ADE80" },  // Green
        { base: "#EAB308", dark: "#A16207", light: "#FACC15" },  // Yellow
        { base: "#EC4899", dark: "#BE185D", light: "#F472B6" },  // Pink
        { base: "#8B5CF6", dark: "#5B21B6", light: "#A78BFA" },  // Purple
        { base: "#06B6D4", dark: "#0E7490", light: "#22D3EE" },  // Cyan
        { base: "#F97316", dark: "#C2410C", light: "#FB923C" },  // Orange
    ];
    
    const SPIN_DURATION = 10000;
    const EXTRA_ROTATIONS = 6;
    const NUM_PEGS = 20; // Number of pegs around the wheel

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
        const outerRimWidth = 25;
        const radius = Math.min(centerX, centerY) * 0.85;
        const innerRadius = radius * 0.18; // Size of center hub
        
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

        // Draw outer shadow for depth
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
        ctx.shadowBlur = 25;
        ctx.shadowOffsetX = 8;
        ctx.shadowOffsetY = 8;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + outerRimWidth, 0, Math.PI * 2);
        ctx.fillStyle = "#1a1a2e";
        ctx.fill();
        ctx.restore();

        // Draw decorative outer rim
        drawOuterRim(centerX, centerY, radius, outerRimWidth);

        if (numSegments === 0) {
            // Empty state with better styling
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            const emptyGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            emptyGradient.addColorStop(0, "#2a2a4a");
            emptyGradient.addColorStop(1, "#1a1a2e");
            ctx.fillStyle = emptyGradient;
            ctx.fill();
            
            ctx.textAlign = "center";
            ctx.font = "bold 18px Rubik, sans-serif";
            ctx.fillStyle = "#6b7280";
            ctx.fillText("Aucun utilisateur", centerX, centerY - 10);
            ctx.fillText("à afficher", centerX, centerY + 15);
            
            drawCenterHub(centerX, centerY, innerRadius);
            drawPegs(centerX, centerY, radius + outerRimWidth * 0.6);
            drawPointer(centerX, centerY, radius + outerRimWidth);
            return;
        }

        const segmentAngle = (2 * Math.PI) / numSegments;
        
        // Draw segments with 3D gradient effect
        for (let i = 0; i < numSegments; i++) {
            const startAngle = currentAngle + i * segmentAngle;
            const endAngle = startAngle + segmentAngle;
            const colorSet = segmentColors[i % segmentColors.length];
            
            // Main segment
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();

            // Create radial gradient for 3D depth effect
            const midAngle = startAngle + segmentAngle / 2;
            const gradientX = centerX + Math.cos(midAngle) * radius * 0.5;
            const gradientY = centerY + Math.sin(midAngle) * radius * 0.5;
            
            if (i === highlightedSegmentIndex && isHighlightBlinkOn) {
                // Winner highlight with golden glow
                const highlightGradient = ctx.createRadialGradient(
                    gradientX, gradientY, 0,
                    centerX, centerY, radius
                );
                highlightGradient.addColorStop(0, "#FFE066");
                highlightGradient.addColorStop(0.5, "#FFD700");
                highlightGradient.addColorStop(1, "#B8860B");
                ctx.fillStyle = highlightGradient;
            } else {
                const gradient = ctx.createRadialGradient(
                    gradientX, gradientY, 0,
                    centerX, centerY, radius
                );
                gradient.addColorStop(0, colorSet.light);
                gradient.addColorStop(0.4, colorSet.base);
                gradient.addColorStop(1, colorSet.dark);
                ctx.fillStyle = gradient;
            }
            ctx.fill();

            // Segment border with subtle inner glow
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw segment divider lines
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            const edgeX = centerX + Math.cos(startAngle) * radius;
            const edgeY = centerY + Math.sin(startAngle) * radius;
            ctx.lineTo(edgeX, edgeY);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw text with shadow for better readability
            ctx.save();
            ctx.translate(centerX, centerY);
            const textAngle = startAngle + segmentAngle / 2;
            ctx.rotate(textAngle);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            
            // Text shadow
            ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            
            ctx.fillStyle = "#fff";
            ctx.font = "bold 14px Rubik, sans-serif";
            const text =
                currentUsersList[i].name.length > 16
                    ? currentUsersList[i].name.substring(0, 14) + "…"
                    : currentUsersList[i].name;
            const textPlacementRadius = radius * 0.68;
            
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

        // Draw inner ring around segments
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw center hub
        drawCenterHub(centerX, centerY, innerRadius);
        
        // Draw pegs around the wheel
        drawPegs(centerX, centerY, radius + outerRimWidth * 0.6);
        
        // Draw pointer last so it's on top
        drawPointer(centerX, centerY, radius + outerRimWidth);
    }

    function drawOuterRim(centerX: number, centerY: number, radius: number, rimWidth: number) {
        // Outer rim with metallic gradient
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + rimWidth, 0, Math.PI * 2);
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
        ctx.closePath();

        const rimGradient = ctx.createRadialGradient(
            centerX - rimWidth, centerY - rimWidth, 0,
            centerX, centerY, radius + rimWidth
        );
        rimGradient.addColorStop(0, "#4a4a6a");
        rimGradient.addColorStop(0.3, "#2a2a4a");
        rimGradient.addColorStop(0.7, "#1a1a3a");
        rimGradient.addColorStop(1, "#0a0a1a");
        ctx.fillStyle = rimGradient;
        ctx.fill();

        // Inner edge highlight
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Outer edge highlight
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + rimWidth - 2, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function drawPegs(centerX: number, centerY: number, pegRadius: number) {
        const pegSize = 8;
        
        for (let i = 0; i < NUM_PEGS; i++) {
            const angle = (i / NUM_PEGS) * Math.PI * 2 - Math.PI / 2;
            const x = centerX + Math.cos(angle) * pegRadius;
            const y = centerY + Math.sin(angle) * pegRadius;
            
            ctx.save();
            
            // Peg shadow
            ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            
            // Metallic peg with gradient
            const pegGradient = ctx.createRadialGradient(
                x - pegSize * 0.3, y - pegSize * 0.3, 0,
                x, y, pegSize
            );
            pegGradient.addColorStop(0, "#FFE066");
            pegGradient.addColorStop(0.3, "#FFD700");
            pegGradient.addColorStop(0.7, "#DAA520");
            pegGradient.addColorStop(1, "#B8860B");
            
            ctx.beginPath();
            ctx.arc(x, y, pegSize, 0, Math.PI * 2);
            ctx.fillStyle = pegGradient;
            ctx.fill();
            
            // Peg highlight
            ctx.beginPath();
            ctx.arc(x - pegSize * 0.25, y - pegSize * 0.25, pegSize * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
            ctx.fill();
            
            ctx.restore();
        }
    }

    function drawCenterHub(centerX: number, centerY: number, innerRadius: number) {
        // Outer ring of center hub
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius + 8, 0, Math.PI * 2);
        const outerHubGradient = ctx.createRadialGradient(
            centerX - 10, centerY - 10, 0,
            centerX, centerY, innerRadius + 8
        );
        outerHubGradient.addColorStop(0, "#FFE066");
        outerHubGradient.addColorStop(0.5, "#FFD700");
        outerHubGradient.addColorStop(1, "#B8860B");
        ctx.fillStyle = outerHubGradient;
        ctx.fill();
        ctx.restore();

        // Inner hub with logo background
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
        const hubGradient = ctx.createRadialGradient(
            centerX - 5, centerY - 5, 0,
            centerX, centerY, innerRadius
        );
        hubGradient.addColorStop(0, "#3a3a5a");
        hubGradient.addColorStop(0.5, "#2a2a4a");
        hubGradient.addColorStop(1, "#1a1a3a");
        ctx.fillStyle = hubGradient;
        ctx.fill();

        // Hub border
        ctx.strokeStyle = "rgba(255, 215, 0, 0.6)";
        ctx.lineWidth = 3;
        ctx.stroke();

        // Logo (doesn't rotate with wheel)
        if (logoImageLoaded && logoImage.complete && logoImage.naturalHeight !== 0 && logoImage.naturalWidth !== 0) {
            ctx.save();
            ctx.translate(centerX, centerY);
            // Logo doesn't rotate - removed ctx.rotate(currentAngle)
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
    }

    function drawPointer(centerX: number, centerY: number, outerRadius: number) {
        if (!ctx) return;
        
        const pointerLength = 50;
        const pointerWidth = 32;
        const pointerTipY = centerY - outerRadius + 18;
        
        ctx.save();
        
        // Pointer shadow
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        // Main pointer body with gradient
        ctx.beginPath();
        ctx.moveTo(centerX, pointerTipY);
        ctx.lineTo(centerX - pointerWidth / 2, pointerTipY - pointerLength);
        ctx.lineTo(centerX - pointerWidth / 2, pointerTipY - pointerLength - 15);
        ctx.lineTo(centerX + pointerWidth / 2, pointerTipY - pointerLength - 15);
        ctx.lineTo(centerX + pointerWidth / 2, pointerTipY - pointerLength);
        ctx.closePath();
        
        const pointerGradient = ctx.createLinearGradient(
            centerX - pointerWidth / 2, pointerTipY - pointerLength,
            centerX + pointerWidth / 2, pointerTipY
        );
        pointerGradient.addColorStop(0, "#B91C1C");
        pointerGradient.addColorStop(0.3, "#EF4444");
        pointerGradient.addColorStop(0.7, "#DC2626");
        pointerGradient.addColorStop(1, "#991B1B");
        ctx.fillStyle = pointerGradient;
        ctx.fill();
        
        // Pointer border
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Pointer highlight
        ctx.beginPath();
        ctx.moveTo(centerX - 2, pointerTipY + 5);
        ctx.lineTo(centerX - pointerWidth / 2 + 5, pointerTipY - pointerLength + 10);
        ctx.lineTo(centerX - pointerWidth / 2 + 8, pointerTipY - pointerLength + 10);
        ctx.lineTo(centerX, pointerTipY + 10);
        ctx.closePath();
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fill();
        
        // Decorative circle at top of pointer
        ctx.beginPath();
        ctx.arc(centerX, pointerTipY - pointerLength - 8, 10, 0, Math.PI * 2);
        const circleGradient = ctx.createRadialGradient(
            centerX - 3, pointerTipY - pointerLength - 11, 0,
            centerX, pointerTipY - pointerLength - 8, 10
        );
        circleGradient.addColorStop(0, "#FFE066");
        circleGradient.addColorStop(0.5, "#FFD700");
        circleGradient.addColorStop(1, "#B8860B");
        ctx.fillStyle = circleGradient;
        ctx.fill();
        ctx.strokeStyle = "#8B7500";
        ctx.lineWidth = 2;
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
            selectedUser = "Erreur pendant l\'animation";
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
        if (!prizeToWinText.trim()) {
            selectedUser = "Veuillez entrer un lot à gagner !";
            winner = null;
            spinning = false;
            return;
        }
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

    function finalizeSelection(idx: number) {
        if (idx >= 0 && idx < users.length) {
            winner = users[idx].name;

            if (
                shouldBroadcastWin &&
                winner &&
                liveServerConnection &&
                liveServerConnection.connectionState === "Connected"
            ) {
                let selectedGifUrl: string | null = null;
                if (winnerGifFiles && winnerGifFiles.length > 0) {
                    const randomIndex = Math.floor(Math.random() * winnerGifFiles.length);
                    selectedGifUrl = winnerGifFiles[randomIndex];
                }
                liveServerConnection.connection
                    .invoke("AnnounceLotteryWinner", winner, prizeToWinText, selectedGifUrl)
                    .catch((err) => console.error("Error announcing winner:", err));
            }

            onwinner?.(new CustomEvent("winner", { detail: { name: winner } }));
            spinning = false;
            highlightedSegmentIndex = -1;
            isHighlightBlinkOn = false;
            drawWheel(users); // Redraw to clear highlight if any
            onspinComplete?.();
        } else {
            winner = null; // No winner determined
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
        // Removed winnerOverlay.hideWinner() call
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
        if (browser) window.removeEventListener("resize", setupCanvasDimensions);
    });
</script>

<div
    bind:this={wheelContainerEl}
    class="wheel-container relative flex w-full max-w-lg flex-col items-center justify-center lg:h-auto lg:grow">
    <div class="wheel-glow-wrapper relative">
        <canvas bind:this={canvasEl} class="wheel-canvas"></canvas>
    </div>
</div>

<div
    class="results-section mt-6 flex min-h-24 w-full max-w-lg flex-col items-center justify-center rounded-xl border-2 border-amber-500/30 bg-linear-to-br from-card via-card to-amber-950/10 p-5 text-center shadow-xl">
    {#if spinning || highlightedSegmentIndex !== -1}
        <div class="flex items-center gap-3 text-2xl text-muted-foreground">
            <span class="inline-block h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent"></span>
            Tirage en cours...
        </div>
    {:else if winner}
        <div class="text-2xl text-success">
            <span class="text-muted-foreground">Gagnant :</span>
            <span class="ml-2 text-3xl font-bold text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">{winner}</span>
        </div>
    {:else if selectedUser}
        <div class="text-2xl text-muted-foreground">{selectedUser}</div>
    {:else}
        <div class="text-2xl text-muted-foreground">🎰 Prêt à tourner !</div>
    {/if}
</div>

<div class="mt-4 w-full max-w-lg space-y-3">
    <div class="flex w-full flex-col gap-1.5">
        <Label for="text" class="flex items-center gap-2 text-amber-400">
            <span class="text-lg">🎁</span> Lot à gagner
        </Label>
        <Input type="text" placeholder="Ex: Massage gratuit" bind:value={prizeToWinText} class="border-amber-500/30 focus:border-amber-500" />
    </div>
    <div class="flex items-center justify-center space-x-2">
        <Checkbox id="broadcastWinCheckbox" bind:checked={shouldBroadcastWin} />
        <label
            for="broadcastWinCheckbox"
            class="text-sm font-medium leading-none text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Annoncer le gagnant globalement ?
        </label>
    </div>
</div>

<style>
    .wheel-glow-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .wheel-glow-wrapper::before {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 105%;
        height: 105%;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255, 215, 0, 0.15) 0%, transparent 70%);
        pointer-events: none;
        z-index: -1;
    }

    .wheel-canvas {
        border-radius: 50%;
        filter: drop-shadow(0 0 20px rgba(0, 0, 0, 0.3));
    }

    .flicker-text {
        animation: flicker 1.5s infinite alternate;
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
