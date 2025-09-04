export type MessageContentPart =
    | { type: "text"; text: string }
    | { type: "link"; url: string; display: string }
    | { type: "image"; url: string }
    | { type: "emoji"; char: string; shortcode: string };

const imageExtRegex = /\.(png|jpe?g|gif|webp|svg)$/i;
const urlRegex = /(https?:\/\/[^\s]+)/gi;
const emojiShortcodeRegex = /:([a-z0-9_+\-]+):/gi;

// Minimal emoji map (extend as needed)
const emojiMap: Record<string, string> = {
    smile: "😄",
    grin: "😁",
    joy: "😂",
    heart: "❤️",
    thumbs_up: "👍",
    fire: "🔥",
    clap: "👏",
    eyes: "👀",
    cry: "😢",
    tada: "🎉",
    wow: "😮",
};

// Replaced flat emoticonMap (key -> emoji) with grouped structure (emoji -> keys)
type EmoticonGroup = { emoji: string; keys: string[] };

const emoticonGroups: EmoticonGroup[] = [
    { emoji: "😊", keys: [":)", ":-)"] },
    { emoji: "☹️", keys: [":(", ":-("] },
    { emoji: "😄", keys: [":D", ":-D"] },
    { emoji: "😉", keys: [";)", ";-)"] },
    { emoji: "😛", keys: [":P", ":-P"] },
    { emoji: "❤️", keys: ["<3"] },
    { emoji: "💔", keys: ["</3"] },
    { emoji: "🤩", keys: ["*_*"] },
];

// Build key->emoji lookup & dynamic pattern (longest keys first)
const emoticonKeyToEmoji: Record<string, string> = {};
for (const g of emoticonGroups) for (const k of g.keys) emoticonKeyToEmoji[k] = g.emoji;

const emoticonPattern = (() => {
    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const allKeys = Object.keys(emoticonKeyToEmoji).sort((a, b) => b.length - a.length);
    return "(" + allKeys.map(escape).join("|") + ")";
})();

// Emoticon parser (runs on plain text segments)
function parseEmoticons(text: string): MessageContentPart[] {
    if (!text) return [];
    const parts: MessageContentPart[] = [];
    const emoRegex = new RegExp(emoticonPattern, "g");
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = emoRegex.exec(text))) {
        const start = match.index;
        const end = emoRegex.lastIndex;
        const prevChar = start > 0 ? text[start - 1] : "";
        const nextChar = end < text.length ? text[end] : "";
        const boundaryBefore = start === 0 || /\s|[\(\[\{'"“”‘’.,!?]/.test(prevChar);
        const boundaryAfter = end === text.length || /\s|[)\]\}'"“”‘’.,!?]/.test(nextChar);
        if (!boundaryBefore || !boundaryAfter) continue;
        if (start > lastIndex) parts.push({ type: "text", text: text.slice(lastIndex, start) });
        const emoticon = match[0];
        const emoji = emoticonKeyToEmoji[emoticon];
        parts.push(emoji ? { type: "emoji", char: emoji, shortcode: emoticon } : { type: "text", text: emoticon });
        lastIndex = end;
    }
    if (lastIndex < text.length) parts.push({ type: "text", text: text.slice(lastIndex) });
    return parts;
}

function parseEmojis(text: string): MessageContentPart[] {
    if (!text) return [];
    const parts: MessageContentPart[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    emojiShortcodeRegex.lastIndex = 0;
    while ((match = emojiShortcodeRegex.exec(text))) {
        const before = text.slice(lastIndex, match.index);
        if (before) parts.push({ type: "text", text: before });
        const shortcode = match[1].toLowerCase();
        const emoji = emojiMap[shortcode];
        if (emoji) {
            parts.push({ type: "emoji", char: emoji, shortcode });
        } else {
            parts.push({ type: "text", text: match[0] });
        }
        lastIndex = emojiShortcodeRegex.lastIndex;
    }
    const rest = text.slice(lastIndex);
    if (rest) parts.push({ type: "text", text: rest });

    // NEW: expand classic emoticons inside all text parts
    const expanded: MessageContentPart[] = [];
    for (const p of parts) {
        if (p.type === "text") {
            expanded.push(...parseEmoticons(p.text));
        } else {
            expanded.push(p);
        }
    }
    return expanded;
}

export function transformMessageContent(content: string): MessageContentPart[] {
    if (!content) return [];
    const result: MessageContentPart[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    urlRegex.lastIndex = 0;

    while ((match = urlRegex.exec(content))) {
        const before = content.slice(lastIndex, match.index);
        if (before) result.push(...parseEmojis(before));
        const url = match[0];
        if (imageExtRegex.test(url.split("?")[0])) {
            result.push({ type: "image", url });
        } else {
            result.push({ type: "link", url, display: url });
        }
        lastIndex = urlRegex.lastIndex;
    }

    const tail = content.slice(lastIndex);
    if (tail) result.push(...parseEmojis(tail));

    return result;
}
