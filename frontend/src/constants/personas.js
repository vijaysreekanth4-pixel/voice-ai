// Real Anam AI personas created in your account.
// Persona IDs are live and ready to use.

export const PERSONAS = [
  // ── English (US) ──────────────────────────────────────────────────────────
  {
    id: 'cfb87fec-d585-49aa-80fb-c75427d13193',
    name: 'Leo',
    gender: 'Male',
    language: 'en',
    langName: 'English',
    accent: 'American',
    emoji: '👨‍💼',
    recognitionLang: 'en-US',
    description: 'Friendly & warm American male',
    gradient: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'ed5c528f-2520-455d-b8ea-ab62185ecd2e',
    name: 'Rachel',
    gender: 'Female',
    language: 'en',
    langName: 'English',
    accent: 'American',
    emoji: '👩‍💼',
    recognitionLang: 'en-US',
    description: 'Polished & professional American female',
    gradient: 'from-purple-600 to-pink-600',
  },
  {
    id: '97201261-892a-4f7c-bc74-9d46e20c0f2e',
    name: 'Mia',
    gender: 'Female',
    language: 'en',
    langName: 'English',
    accent: 'American',
    emoji: '👩‍🎓',
    recognitionLang: 'en-US',
    description: 'Warm & approachable American female',
    gradient: 'from-rose-500 to-pink-600',
  },
  {
    id: '2df2d2f2-7a5b-42bc-b8f7-831cda6ffddd',
    name: 'Gabriel',
    gender: 'Male',
    language: 'en',
    langName: 'English',
    accent: 'American',
    emoji: '🧑‍💻',
    recognitionLang: 'en-US',
    description: 'Cheerful & supportive American male',
    gradient: 'from-sky-500 to-blue-600',
  },
  // ── English (GB) ──────────────────────────────────────────────────────────
  {
    id: '4a86ba37-0156-4d58-a9f1-f6e6e5d21c0b',
    name: 'Archie',
    gender: 'Male',
    language: 'en',
    langName: 'English',
    accent: 'British',
    emoji: '🧑‍🏫',
    recognitionLang: 'en-GB',
    description: 'Warm & conversational British male',
    gradient: 'from-indigo-600 to-violet-700',
  },
  {
    id: '50587f5a-a7ff-41f5-ac93-496541b08619',
    name: 'Lucy',
    gender: 'Female',
    language: 'en',
    langName: 'English',
    accent: 'British',
    emoji: '👩‍💻',
    recognitionLang: 'en-GB',
    description: 'Fresh & energetic British female',
    gradient: 'from-fuchsia-500 to-purple-600',
  },
];

// franc ISO 639-3 → ISO 639-1 language code
export const FRANC_TO_LANG = {
  eng: 'en',
  hin: 'hi',
  tam: 'ta',
  tel: 'te',
  mar: 'mr',
  ben: 'bn',
  kan: 'kn',
  mal: 'ml',
  guj: 'gu',
  pan: 'pa',
  spa: 'es',
  fra: 'fr',
  deu: 'de',
  ara: 'ar',
  por: 'pt',
  zho: 'zh',
  jpn: 'ja',
  kor: 'ko',
  rus: 'ru',
  urd: 'ur',
  nep: 'ne',
  sin: 'si',
};

// ISO 639-1 → BCP-47 recognition language
export const LANG_TO_RECOGNITION = {
  en: 'en-US',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  gu: 'gu-IN',
  pa: 'pa-IN',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  ar: 'ar-SA',
  pt: 'pt-BR',
  zh: 'zh-CN',
  ja: 'ja-JP',
  ko: 'ko-KR',
  ru: 'ru-RU',
  ur: 'ur-PK',
};

// All recognition languages for the selector panel
export const RECOGNITION_LANGS = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'te-IN', label: 'Telugu' },
  { code: 'mr-IN', label: 'Marathi' },
  { code: 'bn-IN', label: 'Bengali' },
  { code: 'kn-IN', label: 'Kannada' },
  { code: 'ml-IN', label: 'Malayalam' },
  { code: 'gu-IN', label: 'Gujarati' },
  { code: 'pa-IN', label: 'Punjabi' },
  { code: 'es-ES', label: 'Spanish' },
  { code: 'fr-FR', label: 'French' },
  { code: 'de-DE', label: 'German' },
  { code: 'ar-SA', label: 'Arabic' },
  { code: 'zh-CN', label: 'Chinese (Mandarin)' },
  { code: 'ja-JP', label: 'Japanese' },
  { code: 'pt-BR', label: 'Portuguese (BR)' },
  { code: 'ru-RU', label: 'Russian' },
  { code: 'ko-KR', label: 'Korean' },
];

export function getPersonasByLanguage(langCode, list = PERSONAS) {
  return list.filter((p) => p.language === langCode);
}

/** Extract ISO 639-1 from a BCP-47 code ('hi-IN' → 'hi') */
export function detectLangCode(recognitionLang) {
  return recognitionLang ? recognitionLang.split('-')[0] : 'en';
}

export const DEFAULT_PERSONA = PERSONAS[0];
