const DEEPL_TRANSLATE_URL = 'https://api-free.deepl.com/v2/translate';

export class DeepLConfigurationError extends Error {}

export const translateTextsToSpanish = async (texts) => {
    if (texts.length === 0) {
        return [];
    }

    const authKey = process.env.DEEPL_API_KEY;

    if (!authKey) {
        throw new DeepLConfigurationError('DEEPL_API_KEY tiene que estar configurada.');
    }

    const response = await fetch(DEEPL_TRANSLATE_URL, {
        method: 'POST',
        headers: {
            Authorization: `DeepL-Auth-Key ${authKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text: texts,
            target_lang: 'ES',
        }),
        signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
        throw new Error(`DeepL translation request falló con HTTP ${response.status}.`);
    }

    const translationResponse = await response.json();
    const translatedTexts = translationResponse.translations?.map(translation => translation.text);

    if (
        !Array.isArray(translatedTexts) ||
        translatedTexts.length !== texts.length ||
        translatedTexts.some(text => typeof text !== 'string')
    ) {
        throw new Error('DeepL devolvió una respuesta de traducción inválida.');
    }

    return translatedTexts;
};

const translateToSpanish = async (text) => (await translateTextsToSpanish([text]))[0];

export default translateToSpanish;
