<script lang="ts">
    import { cn } from "$lib/utils";

    let {
        text,
        class: className,
        glitchEnabled = true,
    }: { text: string; class?: string; glitchEnabled?: boolean } = $props();
</script>

<div class="">
    <div class={cn("stack", className, { "no-glitch": !glitchEnabled })} style="--stacks: 3;">
        <span style="--index: 0;">{text}</span>
        <span style="--index: 1;">{text}</span>
        <span style="--index: 2;">{text}</span>
    </div>
</div>

<style>
    .container {
        color: var(--color);
        display: flex;
        flex-direction: column;
    }

    .stack {
        display: grid;
        grid-template-columns: 1fr;
    }

    .stack span {
        font-weight: bold;
        grid-row-start: 1;
        grid-column-start: 1;
        --stack-height: calc(100% / var(--stacks) - 1px);
        --inverse-index: calc(calc(var(--stacks) - 1) - var(--index));
        --clip-top: calc(var(--stack-height) * var(--index));
        --clip-bottom: calc(var(--stack-height) * var(--inverse-index));
        clip-path: inset(var(--clip-top) 0 var(--clip-bottom) 0);
        animation:
            stack 340ms cubic-bezier(0.46, 0.29, 0, 1.24) 1 backwards calc(var(--index) * 120ms),
            glitch 2s ease infinite 2s alternate-reverse;
    }

    .stack.no-glitch span {
        animation: stack 340ms cubic-bezier(0.46, 0.29, 0, 1.24) 1 backwards calc(var(--index) * 120ms);
    }

    .stack span:nth-child(odd) {
        --glitch-translate: 8px;
    }
    .stack span:nth-child(even) {
        --glitch-translate: -8px;
    }

    @keyframes stack {
        0% {
            opacity: 0;
            transform: translateX(-50%);
            text-shadow:
                -2px 3px 0 fuchsia,
                2px -3px 0 cyan;
        }
        60% {
            opacity: 0.5;
            transform: translateX(50%);
        }
        80% {
            transform: none;
            opacity: 1;
            text-shadow:
                2px -3px 0 fuchsia,
                -2px 3px 0 cyan;
        }
        100% {
            text-shadow: none;
        }
    }

    @keyframes glitch {
        0% {
            text-shadow:
                -2px 3px 0 fuchsia,
                2px -3px 0 cyan;
            transform: translate(var(--glitch-translate));
        }
        2% {
            text-shadow:
                2px -3px 0 fuchsia,
                -2px 3px 0 cyan;
        }
        4%,
        100% {
            text-shadow: none;
            transform: none;
        }
    }
</style>
