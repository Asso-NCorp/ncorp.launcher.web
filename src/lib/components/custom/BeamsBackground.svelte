<script lang="ts">
	import { onMount } from 'svelte';
	import { cn } from '$lib/utils';

	interface AnimatedGradientBackgroundProps {
		className?: string;
		intensity?: 'subtle' | 'medium' | 'strong';
	}

	interface Beam {
		x: number;
		y: number;
		width: number;
		length: number;
		angle: number;
		speed: number;
		opacity: number;
		hue: number;
		pulse: number;
		pulseSpeed: number;
	}

	let { className, intensity = 'strong' }: AnimatedGradientBackgroundProps = $props();

	let canvasElement: HTMLCanvasElement | null = $state(null);
	let beams: Beam[] = $state([]);
	let animationFrameId: number = 0;
	const MINIMUM_BEAMS = 20;

	const opacityMap = {
		subtle: 0.4,
		medium: 0.85,
		strong: 1
	};

	function createBeam(width: number, height: number): Beam {
		const angle = -35 + Math.random() * 10;
		return {
			x: Math.random() * width * 1.5 - width * 0.25,
			y: Math.random() * height * 1.5 - height * 0.25,
			width: 30 + Math.random() * 60,
			length: height * 2.5,
			angle: angle,
			speed: 0.6 + Math.random() * 1.2,
			opacity: 0.12 + Math.random() * 0.16,
			hue: 190 + Math.random() * 70,
			pulse: Math.random() * Math.PI * 2,
			pulseSpeed: 0.02 + Math.random() * 0.03
		};
	}

	function resetBeam(beam: Beam, index: number, totalBeams: number): void {
		if (!canvasElement) return;

		const column = index % 3;
		const spacing = canvasElement.width / 3;

		beam.y = canvasElement.height + 100;
		beam.x =
			column * spacing +
			spacing / 2 +
			(Math.random() - 0.5) * spacing * 0.5;
		beam.width = 100 + Math.random() * 100;
		beam.speed = 0.5 + Math.random() * 0.4;
		beam.hue = 190 + (index * 70) / totalBeams;
		beam.opacity = 0.2 + Math.random() * 0.1;
	}

	function drawBeam(ctx: CanvasRenderingContext2D, beam: Beam): void {
		ctx.save();
		ctx.translate(beam.x, beam.y);
		ctx.rotate((beam.angle * Math.PI) / 180);

		const pulsingOpacity =
			beam.opacity *
			(0.8 + Math.sin(beam.pulse) * 0.2) *
			opacityMap[intensity];

		const gradient = ctx.createLinearGradient(0, 0, 0, beam.length);

		gradient.addColorStop(0, `hsla(${beam.hue}, 85%, 65%, 0)`);
		gradient.addColorStop(
			0.1,
			`hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity * 0.5})`
		);
		gradient.addColorStop(
			0.4,
			`hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity})`
		);
		gradient.addColorStop(
			0.6,
			`hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity})`
		);
		gradient.addColorStop(
			0.9,
			`hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity * 0.5})`
		);
		gradient.addColorStop(1, `hsla(${beam.hue}, 85%, 65%, 0)`);

		ctx.fillStyle = gradient;
		ctx.fillRect(-beam.width / 2, 0, beam.width, beam.length);
		ctx.restore();
	}

	function animate(): void {
		if (!canvasElement) return;
		const ctx = canvasElement.getContext('2d');
		if (!ctx) return;

		ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
		ctx.filter = 'blur(35px)';

		const totalBeams = beams.length;
		beams.forEach((beam, index) => {
			beam.y -= beam.speed;
			beam.pulse += beam.pulseSpeed;

			if (beam.y + beam.length < -100) {
				resetBeam(beam, index, totalBeams);
			}

			drawBeam(ctx, beam);
		});

		animationFrameId = requestAnimationFrame(animate);
	}

	onMount(() => {
		if (!canvasElement) return;

		const ctx = canvasElement.getContext('2d');
		if (!ctx) return;

		const updateCanvasSize = (): void => {
			const dpr = window.devicePixelRatio || 1;
			canvasElement!.width = window.innerWidth * dpr;
			canvasElement!.height = window.innerHeight * dpr;
			canvasElement!.style.width = `${window.innerWidth}px`;
			canvasElement!.style.height = `${window.innerHeight}px`;
			ctx.scale(dpr, dpr);

			const totalBeams = MINIMUM_BEAMS * 1.5;
			beams = Array.from({ length: totalBeams }, () =>
				createBeam(canvasElement!.width, canvasElement!.height)
			);
		};

		updateCanvasSize();
		window.addEventListener('resize', updateCanvasSize);
		animate();

		return () => {
			window.removeEventListener('resize', updateCanvasSize);
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
		};
	});
</script>

<div class={cn('fixed inset-0 overflow-hidden', className)}>
	<canvas
		bind:this={canvasElement}
		class="absolute inset-0"
		style="filter: blur(15px);"
	/>

	<div
		class="absolute inset-0"
		style="backdrop-filter: blur(50px); animation: pulse 10s ease-in-out infinite;"
	/>

	<slot />
</div>

<style>
	@keyframes pulse {
		0%,
		100% {
			opacity: 0.05;
		}
		50% {
			opacity: 0.15;
		}
	}
</style>
