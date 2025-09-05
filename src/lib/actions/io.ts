// Action IntersectionObserver réactive + logs
export type IOOpts = {
    root?: HTMLElement | null;
    thresholds?: number[];
    rootMargin?: string;
    tag?: string;
    on?: (entries: IntersectionObserverEntry[], obs: IntersectionObserver) => void;
};

export function io(node: HTMLElement, opts: IOOpts = {}) {
    let observer: IntersectionObserver | null = null;
    let currentRoot: Element | Document | null = null;

    const mkObserver = (o: IOOpts) => {
        const thresholds = o.thresholds ?? Array.from({ length: 21 }, (_, i) => i / 20); // 0..1
        const root = (o.root ?? null) as Element | null;
        currentRoot = root ?? null;

        observer = new IntersectionObserver(
            (entries, obs) => {
                console.groupCollapsed(
                    `[IO] ${o.tag ?? node.id ?? node.dataset.mid ?? node.tagName} root=${root ? "scroller" : "viewport"}`,
                );
                console.log(
                    "thresholds:",
                    (obs as any).thresholds ?? (obs as any)._thresholds,
                    "rootMargin:",
                    (obs as any).rootMargin,
                );
                for (const e of entries) {
                    console.log({
                        target:
                            (e.target as HTMLElement).id || (e.target as HTMLElement).dataset.mid || e.target.tagName,
                        isIntersecting: e.isIntersecting,
                        ratio: Number(e.intersectionRatio.toFixed(3)),
                        time: Math.round(e.time),
                        bcr: rect(e.boundingClientRect),
                        ir: rect((e as any).intersectionRect),
                        root: rect(e.rootBounds ?? null),
                    });
                }
                console.groupEnd();
                o.on?.(entries, obs);
            },
            { root, threshold: thresholds, rootMargin: o.rootMargin ?? "0px" },
        );

        observer.observe(node);
        console.info("[IO] observe()", { node, root, thresholds, rootMargin: o.rootMargin ?? "0px" });
    };

    const rect = (r: DOMRect | null | undefined) =>
        r ? { t: Math.round(r.top), b: Math.round(r.bottom), h: Math.round(r.height) } : null;

    // init
    mkObserver(opts);

    return {
        update(next: IOOpts = {}) {
            const nextRoot = (next.root ?? null) as Element | null;
            const rootChanged = nextRoot !== currentRoot;
            if (rootChanged || next.thresholds || next.rootMargin) {
                observer?.disconnect();
                mkObserver(next);
            }
        },
        destroy() {
            console.info("[IO] disconnect()", { node });
            observer?.disconnect();
            observer = null;
        },
    };
}
