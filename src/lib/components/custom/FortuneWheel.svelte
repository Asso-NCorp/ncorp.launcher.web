<script lang="ts">
    import { browser } from "$app/environment";
    import { onMount, onDestroy } from "svelte";

    // Props
    interface $$Props {
        users?: { name: string; role: string }[];
        logoPath?: string;
        // ADDED: Event callback definitions
        onspin?: () => void;
        onwinner?: (event: CustomEvent<{ name: string }>) => void;
        onspinComplete?: () => void;
        onerror?: (event: CustomEvent<{ message: string }>) => void;
    }
    // MODIFIED: Destructure event callbacks
    let { users = [], logoPath = "/logo_small.png", onspin, onwinner, onspinComplete, onerror }: $$Props = $props();

    // State
    let selectedUser: string | null = $state(null);
    let spinning = $state(false);
    let winner: string | null = $state(null);
    let logoImage: HTMLImageElement;
    let logoImageLoaded = $state(false);
    const LOGO_SIZE = 80;

    // Canvas/wheel variables
    let canvasEl: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let currentAngle = 0;
    let animationFrameId: number;
    let wheelContainerEl: HTMLDivElement;
    let highlightedSegmentIndex = -1;
    let isHighlightBlinkOn = $state(false);
    const POINTER_ANGLE = -Math.PI / 2;
    const segmentColors = ["#60A5FA", "#F87171", "#4ADE80", "#FACC15", "#F472B6", "#818CF8"];
    const SPIN_DURATION = 5500;
    const EXTRA_ROTATIONS = 6;
    const FRICTION_EFFECT = 0.12;

    // Animation variables
    let initialAngleAtSpinStart = 0;
    let targetAngleValue = 0;
    let spinStartTime = 0;

    // Helper function to convert hex color to RGB object
    function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? {
                  r: parseInt(result[1], 16),
                  g: parseInt(result[2], 16),
                  b: parseInt(result[3], 16),
              }
            : null;
    }

    // Helper function to calculate relative luminance of an RGB color
    function getRelativeLuminance(r: number, g: number, b: number): number {
        const a = [r, g, b].map((v) => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    // Helper function to get a contrasting text color (dark or light)
    function getContrastingTextColor(hexBgColor: string): string {
        const rgb = hexToRgb(hexBgColor);
        if (!rgb) return "hsl(var(--foreground))";

        const luminance = getRelativeLuminance(rgb.r, rgb.g, rgb.b);
        const darkTextColor = "hsl(0, 0%, 10%)"; // Darker text for light backgrounds
        const lightTextColor = "hsl(0, 0%, 95%)"; // Lighter text for dark backgrounds
        return luminance > 0.5 ? darkTextColor : lightTextColor;
    }

    // Draw the wheel with all segments
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
            ctx.fillStyle = "hsl(var(--muted-foreground))";
            ctx.fillText("Aucun utilisateur à afficher", centerX, centerY);
            drawPointer(centerX, centerY, radius); // Dessiner le pointeur même si la roue est vide
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

            if (i === highlightedSegmentIndex && isHighlightBlinkOn) {
                ctx.fillStyle = "hsl(var(--accent))"; // Couleur de surbrillance
            } else {
                ctx.fillStyle = segmentColors[i % segmentColors.length];
            }
            ctx.fill();
            ctx.strokeStyle = "hsl(var(--border))";
            ctx.lineWidth = 2;
            ctx.stroke();

            // Dessiner le texte
            ctx.save();
            ctx.translate(centerX, centerY);
            const textAngle = currentAngle + i * segmentAngle + segmentAngle / 2;
            ctx.rotate(textAngle);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            // Determine text color based on segment background
            const currentSegmentColor = segmentColors[i % segmentColors.length];
            ctx.fillStyle = getContrastingTextColor(currentSegmentColor);

            ctx.font = "bold 16px Rubik, sans-serif";

            const currentUser = currentUsersList[i];
            const textContent =
                currentUser.name.length > 12 ? currentUser.name.substring(0, 10) + "..." : currentUser.name;
            const textPlacementRadius = radius * 0.65;

            // Orienter le texte pour qu'il soit lisible
            let normalizedVisualAngle = textAngle % (2 * Math.PI);
            if (normalizedVisualAngle < 0) normalizedVisualAngle += 2 * Math.PI;

            // If the text is on the left side of the wheel (between 90 and 270 degrees),
            // rotate it by an additional PI (180 degrees) to keep it upright.
            if (normalizedVisualAngle > Math.PI / 2 && normalizedVisualAngle < (3 * Math.PI) / 2) {
                ctx.rotate(Math.PI);
                ctx.fillText(textContent, -textPlacementRadius, 0);
            } else {
                ctx.fillText(textContent, textPlacementRadius, 0);
            }
            ctx.restore();
        }

        // Draw the central logo if loaded
        if (logoImageLoaded && logoImage.complete && logoImage.naturalHeight !== 0 && logoImage.naturalWidth !== 0) {
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(currentAngle); // Rotate with the wheel

            const logoMaxDim = LOGO_SIZE;
            const imgNaturalWidth = logoImage.naturalWidth;
            const imgNaturalHeight = logoImage.naturalHeight;

            let drawWidth, drawHeight;

            if (imgNaturalWidth > imgNaturalHeight) {
                // Image is wider than tall
                drawWidth = logoMaxDim;
                drawHeight = (imgNaturalHeight / imgNaturalWidth) * logoMaxDim;
            } else {
                // Image is taller than wide or is square
                drawHeight = logoMaxDim;
                drawWidth = (imgNaturalWidth / imgNaturalHeight) * logoMaxDim;
            }

            // Fallback for safety, though naturalWidth/Height should be > 0 here
            if (isNaN(drawWidth) || isNaN(drawHeight) || drawWidth <= 0 || drawHeight <= 0) {
                drawWidth = logoMaxDim; // Default to square if calculation fails
                drawHeight = logoMaxDim;
            }

            ctx.drawImage(logoImage, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
            ctx.restore();
        }

        drawPointer(centerX, centerY, radius);
    }

    // Draw the pointer at the top of the wheel
    function drawPointer(centerX: number, centerY: number, radius: number) {
        if (!ctx) return;

        const pointerSize = 26; // Plus grand pour accentuer l'importance du pointeur
        const pointerTipY = centerY - radius - 5;
        const pointerBaseY = pointerTipY - pointerSize * 1.5;

        // Dessiner une ombre pour donner plus de profondeur
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;

        // Dessiner le corps du pointeur
        ctx.fillStyle = "hsl(var(--primary))";
        ctx.strokeStyle = "hsl(var(--card-foreground))";
        ctx.lineWidth = 3; // Plus épais pour accentuer

        ctx.beginPath();
        ctx.moveTo(centerX - pointerSize / 2, pointerBaseY);
        ctx.lineTo(centerX + pointerSize / 2, pointerBaseY);
        ctx.lineTo(centerX, pointerTipY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Petit reflet pour donner un effet 3D
        ctx.beginPath();
        ctx.moveTo(centerX - pointerSize / 4, pointerBaseY + pointerSize / 4);
        ctx.lineTo(centerX, pointerTipY + pointerSize / 8);
        ctx.lineTo(centerX + pointerSize / 8, pointerBaseY + pointerSize / 6);
        ctx.closePath();
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fill();

        ctx.restore();
    }

    // Animation de rotation de la roue
    function spinWheelAnimation(timestamp: number) {
        try {
            if (!spinStartTime) spinStartTime = timestamp;
            const elapsed = timestamp - spinStartTime;
            let progress = Math.min(elapsed / SPIN_DURATION, 1);

            // Fonction d'ease améliorée avec simulation de friction physique
            // mais sans oscillations qui pourraient causer un mouvement en sens inverse
            const easedProgress = (() => {
                // Base easeOut pour le début du mouvement (plus rapide au début)
                const baseEase = 1 - Math.pow(1 - progress, 3);

                if (progress < 0.7) {
                    // Première partie de l'animation: mouvement standard
                    return baseEase;
                } else {
                    // Dernière partie: ajout de friction progressive sans oscillations
                    const frictionPhase = (progress - 0.7) / 0.3; // 0 à 1 sur la phase finale
                    const friction = FRICTION_EFFECT * Math.pow(frictionPhase, 2);

                    // Créer un ralentissement progressif sans rebond en sens inverse
                    // La friction ne fait que ralentir, jamais inverser le mouvement
                    let adjustedEase = baseEase - friction * (1 - Math.pow(1 - frictionPhase, 2));

                    // Garantir que la progression est toujours monotone croissante
                    // pour éviter tout mouvement en sens inverse
                    const previousProgress = 1 - Math.pow(1 - (progress - 0.01), 3);
                    if (adjustedEase < previousProgress && progress > 0.01) {
                        adjustedEase = previousProgress;
                    }

                    return adjustedEase;
                }
            })();
            currentAngle = initialAngleAtSpinStart + (targetAngleValue - initialAngleAtSpinStart) * easedProgress;

            drawWheel(users); // MODIFIED: Pass users

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(spinWheelAnimation);
            } else {
                // Animation completed - Garantir la position finale exacte sans dépassement
                // Assigner directement l'angle cible pour éviter toute imprécision numérique
                currentAngle = targetAngleValue;
                drawWheel(users); // MODIFIED: Pass users

                const winnerIndex = getWinnerIndexFromAngle(currentAngle);

                if (winnerIndex !== -1 && users.length > 0) {
                    highlightWinnerSegment(winnerIndex, () => {
                        finalizeSelection(winnerIndex);
                    });
                } else {
                    // No winner or empty list after spin
                    spinning = false;
                    highlightedSegmentIndex = -1;
                    isHighlightBlinkOn = false;
                    drawWheel(users); // MODIFIED: Pass users
                    onspinComplete?.(); // MODIFIED: dispatch("spinComplete");
                }
            }
        } catch (error) {
            console.error("Error during spin animation:", error);
            // Ensure states are reset in case of an animation error
            spinning = false;
            highlightedSegmentIndex = -1;
            isHighlightBlinkOn = false;
            winner = null; // Clear any potential winner
            selectedUser = "Une erreur est survenue pendant l'animation."; // Notify user
            // MODIFIED: dispatch("error", { message: "Une erreur est survenue pendant l'animation." });
            onerror?.(
                new CustomEvent("error", { detail: { message: "Une erreur est survenue pendant l'animation." } }),
            );

            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            drawWheel(users); // MODIFIED: Pass users
        }
    }

    // Déterminer l'index du gagnant basé sur l'angle de la roue
    function getWinnerIndexFromAngle(wheelAngle: number): number {
        if (users.length === 0) return -1;
        const segmentAngle = (2 * Math.PI) / users.length;
        // Calculer l'angle sur la roue qui est sous le pointeur
        let effectivePointerOnWheel = (POINTER_ANGLE - wheelAngle) % (2 * Math.PI);
        // Normaliser l'angle entre 0 et 2*PI
        if (effectivePointerOnWheel < 0) effectivePointerOnWheel += 2 * Math.PI;

        return Math.floor(effectivePointerOnWheel / segmentAngle);
    }

    // Fonction pour lancer la roue
    export function spinWheel() {
        if (users.length === 0) {
            selectedUser = "Plus d'utilisateurs !";
            winner = null;
            // Ensure states are reset if spin is aborted early
            spinning = false;
            highlightedSegmentIndex = -1;
            isHighlightBlinkOn = false;
            return;
        }

        // Reset all relevant states at the beginning of a new spin
        spinning = true;
        winner = null;
        selectedUser = null; // Clear previous selection message
        highlightedSegmentIndex = -1;
        isHighlightBlinkOn = false;

        onspin?.(); // MODIFIED: dispatch("spin");

        initialAngleAtSpinStart = currentAngle;
        const winnerIndex = Math.floor(Math.random() * users.length);

        const segmentAngle = (2 * Math.PI) / users.length;
        // L'angle final pour que le milieu du segment gagnant soit sous le pointeur
        let finalOrientation = POINTER_ANGLE - (winnerIndex * segmentAngle + segmentAngle / 2);

        targetAngleValue = initialAngleAtSpinStart;
        // S'assurer que la roue tourne dans le sens positif et fait plusieurs tours
        targetAngleValue -= targetAngleValue % (2 * Math.PI); // Normaliser à un multiple de 2PI
        // Ajout d'un nombre aléatoire de rotations supplémentaires pour plus d'imprévisibilité
        const extraRotations = EXTRA_ROTATIONS + Math.random();
        targetAngleValue += extraRotations * 2 * Math.PI; // Ajouter les tours supplémentaires

        targetAngleValue +=
            (finalOrientation - (initialAngleAtSpinStart % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); // Ajouter le décalage pour le gagnant

        // S'assurer que targetAngleValue est bien supérieur à initialAngleAtSpinStart pour une rotation en avant
        if (targetAngleValue <= initialAngleAtSpinStart) {
            targetAngleValue += 2 * Math.PI;
        }

        // Arrondir l'angle cible pour éviter les imprécisions numériques
        targetAngleValue = Math.round(targetAngleValue * 1000) / 1000;

        spinStartTime = 0; // Réinitialiser pour l'animation
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(spinWheelAnimation);
    }

    // Finaliser la sélection après l'animation
    function finalizeSelection(winnerIndex: number) {
        if (winnerIndex >= 0 && winnerIndex < users.length) {
            winner = users[winnerIndex].name;

            // Dispatch l\'événement winner
            onwinner?.(new CustomEvent("winner", { detail: { name: winner } })); // MODIFIED: dispatch("winner", { name: winner });

            // CRITICAL: Reset spinning state immediately after selection
            spinning = false;
            highlightedSegmentIndex = -1; // Should already be -1 from highlightWinnerSegment
            isHighlightBlinkOn = false; // Should already be false from highlightWinnerSegment
            drawWheel(users); // MODIFIED: Pass users
            onspinComplete?.(); // MODIFIED: dispatch("spinComplete");
        } else {
            // No valid winner from highlight phase
            winner = null;
            spinning = false;
            highlightedSegmentIndex = -1;
            isHighlightBlinkOn = false;
            drawWheel(users); // MODIFIED: Pass users
            onspinComplete?.(); // MODIFIED: dispatch("spinComplete");
        }
    }

    // Fonction pour gérer le clignotement du segment gagnant
    function highlightWinnerSegment(winnerIndex: number, callback: () => void) {
        if (winnerIndex < 0 || winnerIndex >= users.length) {
            // If no valid winner for highlighting, reset states and callback
            highlightedSegmentIndex = -1;
            isHighlightBlinkOn = false;
            // spinning state will be handled by finalizeSelection or the caller path
            callback();
            return;
        }
        highlightedSegmentIndex = winnerIndex; // Set for blinking
        // isHighlightBlinkOn will be toggled by blink()

        let blinkCount = 0;
        const maxBlinks = 6; // 3 cycles on/off
        const blinkInterval = 150; // ms

        function blink() {
            isHighlightBlinkOn = !isHighlightBlinkOn;
            drawWheel(users); // MODIFIED: Pass users

            blinkCount++;
            if (blinkCount < maxBlinks) {
                setTimeout(blink, blinkInterval);
            } else {
                // Blinking finished
                highlightedSegmentIndex = -1; // Reset before callback
                isHighlightBlinkOn = false; // Reset before callback
                drawWheel(users); // MODIFIED: Pass users
                // Small delay before callback to ensure final draw completes and state is stable
                setTimeout(callback, 50);
            }
        }
        blink(); // Start the blinking
    }

    // Réinitialiser la roue
    export function resetWheel() {
        spinning = false;
        winner = null;
        selectedUser = null;

        // Reset wheel-specific state
        currentAngle = 0;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        highlightedSegmentIndex = -1;
        isHighlightBlinkOn = false;
        drawWheel(users); // MODIFIED: Pass users
    }

    // Ajuster les dimensions du canvas en fonction du conteneur
    function setupCanvasDimensions() {
        if (canvasEl && wheelContainerEl) {
            const containerWidth = wheelContainerEl.clientWidth;
            let size;

            // Use a common breakpoint for 'lg' (1024px) to differentiate sizing logic
            // On large screens, prioritize width for a square canvas.
            // The container has max-w-md, so its width is constrained.
            if (window.innerWidth >= 1024) {
                size = containerWidth * 0.95; // Use 0.95 for a little padding
            } else {
                // On smaller screens, use the previous logic which respects the container's h-[400px]
                const containerHeight = wheelContainerEl.clientHeight;
                size = Math.min(containerWidth, containerHeight) * 0.95;
            }

            canvasEl.width = size * 1.5;
            canvasEl.height = size * 1.5; // Ensure the canvas is square
            drawWheel(users); // MODIFIED: Pass users
        }
    }

    // Redessiner la roue lorsque les utilisateurs changent
    $effect(() => {
        // ADDED: Logging to debug reactivity
        console.log("[FortuneWheel $effect] Triggered. Users length:", users?.length, "ctx available:", !!ctx);
        if (users && ctx) {
            console.log(
                "[FortuneWheel $effect] Conditions met. Calling drawWheel(). Users:",
                JSON.stringify(users.map((u) => u.name)),
            );
            // Redraw the wheel when users change and the canvas is ready
            drawWheel(users); // MODIFIED: Pass users prop
        }
    });

    onMount(() => {
        if (browser) {
            // Initialize canvas
            const canvas = canvasEl;
            if (!canvas) return;
            const context = canvas.getContext("2d");
            if (!context) return;
            ctx = context;

            // Setup canvas dimensions based on container
            setupCanvasDimensions(); // Call it once initially
            window.addEventListener("resize", setupCanvasDimensions);

            // Load logo image
            logoImage = new Image();
            logoImage.src = logoPath;
            logoImage.onload = () => {
                logoImageLoaded = true;
                if (ctx) drawWheel(users); // MODIFIED: Pass users
            };
            logoImage.onerror = () => {
                console.error("Failed to load logo image:", logoPath);
            };
        }
    });

    onDestroy(() => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        if (browser) {
            window.removeEventListener("resize", setupCanvasDimensions);
        }
    });
</script>

<div
    bind:this={wheelContainerEl}
    class="wheel-container relative flex w-full max-w-md flex-col items-center justify-center lg:h-auto lg:flex-grow">
    <canvas bind:this={canvasEl} class="rounded-full"></canvas>
</div>

<!-- Résultat du tirage -->
<div
    class="results-section mt-6 flex min-h-[80px] w-full max-w-md flex-col items-center justify-center rounded-lg border border-border bg-card p-4 text-center shadow-lg">
    {#if spinning || highlightedSegmentIndex !== -1}
        <div class="text-2xl text-muted-foreground">Tirage en cours...</div>
    {:else if winner}
        <div class="text-2xl text-success">
            Gagnant : <span class="font-ggsans-bold text-3xl text-primary">{winner}</span>
        </div>
    {:else if selectedUser}
        <div class="text-4xl text-muted-foreground">{selectedUser}</div>
    {:else}
        <div class="text-4xl text-muted-foreground">Prêt à tourner !</div>
    {/if}
</div>
