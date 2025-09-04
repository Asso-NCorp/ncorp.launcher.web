<script lang="ts">
    const {
        size = 6, // dot diameter in px
        color = "currentColor",
        speed = 900, // total cycle in ms
        spacing = 4, // gap between dots in px
    } = $props<{
        size?: number;
        color?: string;
        speed?: number;
        spacing?: number;
    }>();
</script>

<div
    class="typing-indicator"
    style="--ti-size:{size}px; --ti-color:{color}; --ti-speed:{speed}ms; --ti-gap:{spacing}px"
    aria-hidden="true">
    <span class="dot" />
    <span class="dot" />
    <span class="dot" />
</div>

<style>
    .typing-indicator {
        display: inline-flex;
        align-items: flex-end;
        gap: var(--ti-gap, 4px);
        --dot-size: var(--ti-size, 6px);
        --dot-color: var(--ti-color, currentColor);
        --cycle: var(--ti-speed, 900ms);
    }
    .dot {
        width: var(--dot-size);
        height: var(--dot-size);
        background: var(--dot-color);
        border-radius: 50%;
        opacity: 0.35;
        animation: ti-bounce var(--cycle) ease-in-out infinite;
    }
    .dot:nth-child(1) {
        animation-delay: 0ms;
    }
    .dot:nth-child(2) {
        animation-delay: calc(var(--cycle) * 0.15);
    }
    .dot:nth-child(3) {
        animation-delay: calc(var(--cycle) * 0.3);
    }

    @keyframes ti-bounce {
        0% {
            transform: translateY(0);
            opacity: 0.35;
        }
        12% {
            transform: translateY(-4px);
            opacity: 1;
        }
        24% {
            transform: translateY(0);
            opacity: 0.35;
        }
        100% {
            transform: translateY(0);
            opacity: 0.35;
        }
    }
</style>
