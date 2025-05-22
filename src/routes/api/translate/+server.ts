import translate from "google-translate-api-x";
import type { googleTranslateApi } from "google-translate-api-x";

export async function POST({ request }) {

    // Get text from request body
    const { text } = await request.json();

    // Translate text
    const translated = await translate(text, { to: "fr", from: "en", forceBatch: false }) as googleTranslateApi.TranslationResponse;

    // Return translated text
    return new Response(translated.text);
}
