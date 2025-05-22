<script lang="ts">
    let {
        mainCircleSize = 210,
        mainCircleOpacity = 0.24,
        numCircles = 8,
    }: {
        mainCircleSize?: number;
        mainCircleOpacity?: number;
        numCircles?: number;
    } = $props();
</script>

<div
    class="absolute inset-0 flex items-center justify-center [mask-image:linear-gradient(to_bottom,white,transparent)]">
    {#each { length: numCircles } as _, i}
        <div
            class="animate-ripple absolute left-1/2 top-1/2 translate-x-1/2 translate-y-1/2 rounded-full border bg-white/30 shadow-xl [--i:{i}]"
            style="width: {mainCircleSize + i * 10}px;
         height: {mainCircleSize + i * 10}px;
         opacity: {mainCircleOpacity ? mainCircleOpacity - i * 0.03 : 0}; 
         animation-delay: {i * 0.08}s;
         border-style:{i === numCircles - 1 ? 'dashed' : 'solid'};
         border-width: 1px;
         border-color: rgba(var(--foreground-rgb), {(5 + i * 5) / 100});
        ">
        </div>
    {/each}
</div>
