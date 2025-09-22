<script lang="ts">
    import { cn } from "$lib/utils";

    let {
        class: clazz,
        animate,
    }: {
        class?: string | undefined;
        animate?: boolean;
    } = $props();
</script>

<div class={cn("relative mx-auto w-full", clazz)}>
    <div
        class="absolute inset-x-0 top-0 h-[2px] w-full bg-linear-to-r from-transparent via-blue-600 to-transparent blur-sm">
    </div>
    <div
        class="absolute inset-x-0 top-0 h-px w-full bg-linear-to-r from-transparent via-fuchsia-600/50 to-transparent">
    </div>
    <div
        class={cn(
            "absolute top-0 h-[3px] w-2/4 bg-linear-to-r from-transparent via-sky-500/50 to-transparent blur-sm",
            { "animate-move": animate },
        )}>
    </div>
    <div
        class={cn("absolute top-0 h-px w-2/4 bg-linear-to-r from-transparent via-violet-500 to-transparent", {
            "animate-move": animate,
        })}>
    </div>
</div>

<style>
    /* Animation CSS */
    @keyframes move {
        0% {
            transform: translateX(0);
        }
        50% {
            transform: translateX(90%);
        }
        100% {
            transform: translateX(0);
        }
    }

    /* Classe pour animer le déplacement */
    .animate-move {
        animation: move 5s ease-in-out infinite; /* Animation en boucle */
    }
</style>
