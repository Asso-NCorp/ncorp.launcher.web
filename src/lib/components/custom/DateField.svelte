<script lang="ts">
    import Calendar from "$lib/components/ui/calendar/calendar.svelte";
    import * as Popover from "$lib/components/ui/popover/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
    import { getLocalTimeZone, today, parseDate, type CalendarDate } from "@internationalized/date";
    import { Input } from "$lib/components/ui/input";

    // Props bindables + rest pour relayer {...props} du Form.Control
    let {
        value = $bindable<string | undefined | null>(), // allow null
        id = crypto?.randomUUID?.() ?? "dob",
        label = "Date",
        placeholder = "Select date",
        ...rest
    } = $props();

    // Coerce Date object (if any) to YYYY-MM-DD immediately
    if (value && typeof value !== "string") {
        try {
            // @ts-ignore
            if (value instanceof Date) value = value.toISOString().slice(0, 10);
        } catch {}
    }

    let open = $state(false);
    let calValue = $state<CalendarDate | undefined>(typeof value === "string" ? safeParse(value) : undefined);

    function safeParse(v: string) {
        // Treat year 0001 as empty
        if (v.startsWith("0001-")) return undefined;
        try {
            return parseDate(v);
        } catch {
            return undefined;
        }
    }

    // NEW: track internal vs external updates to prevent immediate reset
    let internalUpdate = $state(false);
    let lastExternal = $state<string | undefined>(typeof value === "string" ? value : undefined);

    // UPDATED effect with guard
    $effect(() => {
        const ext =
            value && typeof value !== "string"
                ? value instanceof Date
                    ? value.toISOString().slice(0, 10)
                    : undefined
                : (value as string | undefined);
        if (ext !== value) {
            // write back coerced string if needed
            // @ts-ignore
            value = ext;
        }
        if (internalUpdate) return;
        if (ext !== lastExternal) {
            calValue = ext ? safeParse(ext) : undefined;
            lastExternal = ext;
        }
    });

    // Display input (dd/MM/yyyy)
    let displayedInput = $state<string>("");

    function isoToDisplay(iso?: string) {
        if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
        if (iso.startsWith("0001-")) return ""; // hide sentinel date
        const [y, m, d] = iso.split("-");
        return `${d}/${m}/${y}`;
    }

    function displayToIso(str: string): string | undefined {
        const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(str.trim());
        if (!m) return undefined;
        let [_, d, mo, y] = m;
        const day = d.padStart(2, "0");
        const month = mo.padStart(2, "0");
        // Basic validity check
        const iso = `${y}-${month}-${day}`;
        try {
            parseDate(iso); // will throw if invalid
            return iso;
        } catch {
            return undefined;
        }
    }

    // Initialize displayed input
    displayedInput = isoToDisplay(value as string | undefined);

    // Update displayedInput when external value changes (guarded)
    $effect(() => {
        if (internalUpdate) return;
        let iso = (value as string | undefined) ?? undefined;
        if (iso && iso.startsWith("0001-")) {
            // Normalize sentinel to undefined
            iso = undefined;
            value = undefined;
        }
        const disp = isoToDisplay(iso);
        if (disp !== displayedInput) displayedInput = disp;
    });

    function handleManualInput(e: Event) {
        const str = (e.target as HTMLInputElement).value;
        displayedInput = str;
        internalUpdate = true;
        const iso = displayToIso(str);
        if (iso) {
            value = iso;
            calValue = safeParse(iso);
            lastExternal = iso;
        } else if (str.trim() === "") {
            value = undefined;
            calValue = undefined;
            lastExternal = undefined;
        }
        queueMicrotask(() => (internalUpdate = false));
    }

    function onPick(v: CalendarDate | undefined) {
        internalUpdate = true;
        calValue = v;
        const newVal = v ? v.toString() : undefined;
        value = newVal;
        displayedInput = isoToDisplay(newVal);
        lastExternal = newVal;
        open = false;
        queueMicrotask(() => (internalUpdate = false));
    }
</script>

<div class="flex flex-col gap-3">
    <label for="{id}-date-input" class="px-1">{label}</label>

    <Popover.Root bind:open>
        <div class="flex items-center gap-2">
            <Input
                id="{id}-date-input"
                inputmode="numeric"
                {placeholder}
                bind:value={displayedInput}
                on:input={handleManualInput}
                {...rest}
                class="w-48"
                autocomplete="off" />

            <Popover.Trigger>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Ouvrir le calendrier"
                    on:click={() => (open = !open)}>
                    <ChevronDownIcon class="size-4" />
                </Button>
            </Popover.Trigger>
        </div>

        <Popover.Content class="w-auto overflow-hidden p-0" align="start">
            <Calendar
                type="single"
                bind:value={calValue}
                captionLayout="dropdown"
                onValueChange={() => onPick(calValue)}
                maxValue={today(getLocalTimeZone())} />
        </Popover.Content>
    </Popover.Root>
</div>
