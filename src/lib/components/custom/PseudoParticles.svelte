<script lang="ts">
    import { onMount, onDestroy } from "svelte";

    // List of pseudos to display in the background
    export let pseudos: string[] = [
        "SkyRunner",
        "NeonByte",
        "CyberWolf",
        "PixelQueen",
        "MoonRider",
        "ShadowHunter",
        "StarGazer",
        "GalaxyNova",
        "NightOwl",
        "TechWizard",
        "DreamSeeker",
        "CrystalMage",
        "OceanWave",
        "FireFox",
        "IcePhoenix",
    ];

    // Number of particles to display (limited by the list of pseudos)
    export let particleCount = Math.min(20, pseudos.length);

    // Particle properties
    let speeds: { x: number; y: number }[] = [];
    let positions: { x: number; y: number; tilt: number; targetTilt: number; slowdownTimer: number }[] = [];
    let sizes: number[] = [];
    let opacities: number[] = [];
    let dimensions: { width: number; height: number }[] = [];
    let colors: { h: number; s: number; l: number }[] = [];

    // Constants for rocket boost effect
    const targetSpeed = 0.1; // Normal speed to return to
    const minSpeed = 0.02; // Minimum speed to prevent stopping
    const reductionFactor = 0.5; // Speed reduction after collision
    const slowdownDuration = 2.0; // Duration of slowdown in seconds
    const accelerationRate = 0.001; // Speed increase per frame after slowdown
    const scaleFactor = 0.8; // Scale factor for collision distance

    let isInitialized = false;

    // Check if two particles overlap
    function checkOverlap(i: number, j: number): boolean {
        const dx = positions[i].x - positions[j].x;
        const dy = positions[i].y - positions[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Calculate diagonals of the bounding boxes
        const diagonalI = Math.sqrt(dimensions[i].width ** 2 + dimensions[i].height ** 2);
        const diagonalJ = Math.sqrt(dimensions[j].width ** 2 + dimensions[j].height ** 2);

        // Set collision threshold with a scale factor
        const minDistance = (scaleFactor * (diagonalI + diagonalJ)) / 2;

        return distance < minDistance;
    }

    // Initialize particles without overlaps
    function initializeParticles() {
        speeds = [];
        positions = [];
        sizes = [];
        opacities = [];
        dimensions = [];
        colors = [];

        for (let i = 0; i < particleCount; i++) {
            sizes.push(0.8 + Math.random() * 1);
            opacities.push(0.15 + Math.random() * 0.2);
            colors.push({
                h: Math.floor(Math.random() * 360),
                s: 70 + Math.floor(Math.random() * 30),
                l: 50 + Math.floor(Math.random() * 30),
            });

            const pseudoLength = pseudos[i % pseudos.length].length;
            dimensions.push({
                width: pseudoLength * sizes[i] * 0.6,
                height: sizes[i] * 1.2,
            });

            let x, y;
            let attempts = 0;
            do {
                x = Math.random() * 100;
                y = Math.random() * 100;
                positions.push({ x, y, tilt: Math.random() * 160 - 80, targetTilt: 0, slowdownTimer: 0 });
                attempts++;
                if (i > 0 && positions.some((_, idx) => idx < i && checkOverlap(i, idx))) {
                    positions.pop();
                } else {
                    break;
                }
            } while (attempts < 100);

            positions[i].targetTilt = Math.random() * 160 - 80;
            speeds.push({
                x: (Math.random() - 0.5) * 0.1,
                y: (Math.random() - 0.5) * 0.1,
            });
        }
        isInitialized = true;
    }

    // Avoid collisions by adjusting trajectories and applying rocket boost effect
    function avoidCollisions() {
        for (let i = 0; i < particleCount; i++) {
            for (let j = i + 1; j < particleCount; j++) {
                if (checkOverlap(i, j)) {
                    const dx = positions[i].x - positions[j].x;
                    const dy = positions[i].y - positions[j].y;
                    const angle = Math.atan2(dy, dx);
                    const pushStrength = 0.01;

                    speeds[i].x += Math.cos(angle) * pushStrength;
                    speeds[i].y += Math.sin(angle) * pushStrength;
                    speeds[j].x -= Math.cos(angle) * pushStrength;
                    speeds[j].y -= Math.sin(angle) * pushStrength;

                    // Reduce speeds and start slowdown timer
                    speeds[i].x *= reductionFactor;
                    speeds[i].y *= reductionFactor;
                    speeds[j].x *= reductionFactor;
                    speeds[j].y *= reductionFactor;

                    positions[i].slowdownTimer = slowdownDuration;
                    positions[j].slowdownTimer = slowdownDuration;
                }
            }
        }
    }

    // Animation loop
    let animationFrameId: number;
    let lastTime = 0;

    function animate(timestamp: number) {
        const deltaTime = (timestamp - lastTime) / 1000; // Convert to seconds
        lastTime = timestamp;

        if (isInitialized) {
            avoidCollisions();

            positions = positions.map((pos, i) => {
                if (pos.slowdownTimer > 0) {
                    pos.slowdownTimer -= deltaTime;
                } else {
                    const currentSpeed = Math.sqrt(speeds[i].x * speeds[i].x + speeds[i].y * speeds[i].y);
                    if (currentSpeed < minSpeed) {
                        const angle = Math.random() * 2 * Math.PI;
                        speeds[i].x = Math.cos(angle) * minSpeed;
                        speeds[i].y = Math.sin(angle) * minSpeed;
                    } else if (currentSpeed < targetSpeed) {
                        const directionX = speeds[i].x / currentSpeed;
                        const directionY = speeds[i].y / currentSpeed;
                        const newSpeed = Math.min(currentSpeed + accelerationRate, targetSpeed);
                        speeds[i].x = directionX * newSpeed;
                        speeds[i].y = directionY * newSpeed;
                    }
                }

                let newX = pos.x + speeds[i].x;
                let newY = pos.y + speeds[i].y;
                const tiltSpeed = 0.05;
                let newTilt = pos.tilt + (pos.targetTilt - pos.tilt) * tiltSpeed;

                if (timestamp % 200 === 0) {
                    pos.targetTilt = Math.random() * 160 - 80;
                }

                const width = dimensions[i].width;
                const height = dimensions[i].height;
                if (newX > 100 + width) newX = -width;
                if (newX < -width) newX = 100 + width;
                if (newY > 100 + height) newY = -height;
                if (newY < -height) newY = 100 + height;

                return {
                    x: newX,
                    y: newY,
                    tilt: newTilt,
                    targetTilt: pos.targetTilt,
                    slowdownTimer: pos.slowdownTimer,
                };
            });
        }

        animationFrameId = requestAnimationFrame(animate);
    }

    onMount(() => {
        initializeParticles();
        requestAnimationFrame(animate);
    });

    onDestroy(() => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
    });
</script>

<div class="particles-container">
    {#if isInitialized}
        {#each Array(particleCount) as _, i}
            <div
                class="particle"
                style="
                    color: hsl({colors[i].h}, {colors[i].s}%, {colors[i].l}%);
                    font-size: {sizes[i]}em;
                    opacity: {opacities[i]};
                    left: {positions[i].x}vw;
                    top: {positions[i].y}vh;
                    transform: rotate({positions[i].tilt}deg);
                ">
                {pseudos[i % pseudos.length]}
            </div>
        {/each}
    {/if}
</div>

<style>
    .particles-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        z-index: -1;
        pointer-events: none;
    }

    .particle {
        position: absolute;
        white-space: nowrap;
        user-select: none;
        filter: blur(1px);
        will-change: transform, left, top;
    }
</style>
