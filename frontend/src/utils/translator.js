/**
 * UI translations and speech synthesis language mappings.
 */

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', voiceCode: 'en-US' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', voiceCode: 'hi-IN' },
  { code: 'es', name: 'Spanish', native: 'Español', voiceCode: 'es-ES' },
  { code: 'fr', name: 'French', native: 'Français', voiceCode: 'fr-FR' },
  { code: 'de', name: 'German', native: 'Deutsch', voiceCode: 'de-DE' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', voiceCode: 'te-IN' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', voiceCode: 'ta-IN' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', voiceCode: 'bn-IN' }
];

// Dictionary of core complaint concepts
const CORE_TRANSLATIONS = {
  // Statuses
  SUBMITTED: {
    en: 'Submitted / Open',
    hi: 'दर्ज किया गया (प्रतीक्षारत)',
    es: 'Enviado / Pendiente',
    fr: 'Soumis / En attente',
    de: 'Eingereicht / Offen',
    te: 'దాఖలు చేయబడింది (వేచి ఉంది)',
    ta: 'சமர்ப்பிக்கப்பட்டது (காத்திருக்கிறது)',
    bn: 'জমা দেওয়া হয়েছে (অপেক্ষমাণ)'
  },
  ASSIGNED: {
    en: 'Assigned to Technician',
    hi: 'तकनीशियन को सौंपा गया',
    es: 'Asignado al Técnico',
    fr: 'Assigné au Technicien',
    de: 'Techniker zugewiesen',
    te: 'టెక్నీషియన్‌కు కేటాయించబడింది',
    ta: 'தொழில்நுட்ப வல்லுநருக்கு ஒதுக்கப்பட்டது',
    bn: 'টেকনিশিয়ানকে অর্পণ করা হয়েছে'
  },
  IN_PROGRESS: {
    en: 'In Progress (Repair Underway)',
    hi: 'कार्य प्रगति पर है',
    es: 'En Progreso (Reparación en curso)',
    fr: 'En cours de réparation',
    de: 'In Bearbeitung',
    te: 'పని పురోగతిలో ఉంది',
    ta: 'பணி நடந்து கொண்டிருக்கிறது',
    bn: 'কাজ চলছে'
  },
  RESOLVED: {
    en: 'Resolved & Tested',
    hi: 'समस्या का समाधान हो गया',
    es: 'Resuelto y Verificado',
    fr: 'Résolu et Vérifié',
    de: 'Gelöst und Geprüft',
    te: 'పరిష్కరించబడింది',
    ta: 'தீர்க்கப்பட்டது',
    bn: 'সমাধান করা হয়েছে'
  },
  CLOSED: {
    en: 'Closed',
    hi: 'शिकायत बंद कर दी गई',
    es: 'Cerrado',
    fr: 'Fermé',
    de: 'Geschlossen',
    te: 'మూసివేయబడింది',
    ta: 'மூடப்பட்டது',
    bn: 'বন্ধ করা হয়েছে'
  },
  REOPENED: {
    en: 'Reopened for Review',
    hi: 'पुनः खोला गया',
    es: 'Reabierto para Revisión',
    fr: 'Rouvert pour Examen',
    de: 'Zur Überprüfung wiedereröffnet',
    te: 'సమీక్ష కోసం మళ్లీ తెరవబడింది',
    ta: 'மீண்டும் திறக்கப்பட்டது',
    bn: 'পুনরায় খোলা হয়েছে'
  },

  // Categories
  PLUMBING: {
    en: 'Plumbing & Water Supply',
    hi: 'नलसाजी एवं जल आपूर्ति',
    es: 'Fontanería y Suministro de Agua',
    fr: 'Plomberie et Eau',
    de: 'Klempner- & Wasserversorgung',
    te: 'ప్లంబింగ్ & నీటి సరఫరా',
    ta: 'குழாய் பழுது மற்றும் நீர் வழங்கல்',
    bn: 'প্লাম্বিং ও জল সরবরাহ'
  },
  ELECTRICAL: {
    en: 'Electrical & Power',
    hi: 'बिजली एवं वायरिंग',
    es: 'Electricidad y Energía',
    fr: 'Électricité et Alimentation',
    de: 'Elektrik & Strom',
    te: 'విద్యుత్ & పవర్',
    ta: 'மின்சாரம் & மின் இணைப்பு',
    bn: 'বিদ্যুৎ ও তারের কাজ'
  },
  FURNITURE: {
    en: 'Furniture & Carpentry',
    hi: 'फर्नीचर एवं बढ़ईगीरी',
    es: 'Muebles y Carpintería',
    fr: 'Meubles et Menuiserie',
    de: 'Möbel & Schreinerei',
    te: 'ఫర్నిచర్ & కార్పెంట్రీ',
    ta: 'மரச்சாமான்கள் & தச்சு வேலை',
    bn: 'আসবাবপত্র ও ছুতার কাজ'
  },
  NETWORK: {
    en: 'Internet & Wi-Fi',
    hi: 'इंटरनेट एवं वाई-फाई',
    es: 'Internet y Wi-Fi',
    fr: 'Internet et Wi-Fi',
    de: 'Internet & WLAN',
    te: 'ఇంటర్నెట్ & వై-ఫై',
    ta: 'இணையம் & வைஃபை',
    bn: 'ইন্টারনেট ও ওয়াই-ফাই'
  },
  CLEANING: {
    en: 'Housekeeping & Sanitation',
    hi: 'सफाई एवं स्वच्छता',
    es: 'Limpieza y Sanitización',
    fr: 'Nettoyage et Entretien',
    de: 'Reinigung & Hygiene',
    te: 'శుభ్రత & పరిశుభ్రత',
    ta: 'சுத்தம் மற்றும் சுகாதாரம்',
    bn: 'পরিচ্ছন্নতা ও স্যানিটেশন'
  },

  // Priorities
  LOW: {
    en: 'Low Priority',
    hi: 'निम्न प्राथमिकता',
    es: 'Prioridad Baja',
    fr: 'Basse Priorité',
    de: 'Niedrige Priorität',
    te: 'తక్కువ ప్రాధాన్యత',
    ta: 'குறைந்த முன்னுரிமை',
    bn: 'কম অগ্রাধিকার'
  },
  MEDIUM: {
    en: 'Medium Priority',
    hi: 'मध्यम प्राथमिकता',
    es: 'Prioridad Media',
    fr: 'Priorité Moyenne',
    de: 'Mittlere Priorität',
    te: 'మధ్యస్థ ప్రాధాన్యత',
    ta: 'நடுத்தர முன்னுரிமை',
    bn: 'মাঝারি অগ্রাধিকার'
  },
  HIGH: {
    en: 'High Priority',
    hi: 'उच्च प्राथमिकता',
    es: 'Alta Prioridad',
    fr: 'Haute Priorité',
    de: 'Hohe Priorität',
    te: 'అధిక ప్రాధాన్యత',
    ta: 'உயர் முன்னுரிமை',
    bn: 'উচ্চ অগ্রাধিকার'
  },
  EMERGENCY: {
    en: 'Emergency / Urgent',
    hi: 'आपातकालीन (तत्काल)',
    es: 'Emergencia / Urgente',
    fr: 'Urgence Immédiate',
    de: 'Notfall / Dringend',
    te: 'అత్యవసర పరిస్థితి',
    ta: 'அவசரநிலை',
    bn: 'জরুরী / তাৎক্ষণিক'
  }
};

// Common maintenance update phrases for phrase-matching translation
const PHRASE_MAP = [
  {
    en: 'Complaint submitted by resident student',
    hi: 'छात्र द्वारा शिकायत सफलतापूर्वक दर्ज की गई',
    es: 'Queja presentada exitosamente por el estudiante',
    fr: 'Plainte soumise par l’étudiant résident',
    de: 'Beschwerde erfolgreich vom Studenten eingereicht',
    te: 'విద్యార్థి ద్వారా ఫిర్యాదు సమర్పించబడింది',
    ta: 'மாணவரால் புகார் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது',
    bn: 'শিক্ষার্থী কর্তৃক অভিযোগ দাখিল করা হয়েছে'
  },
  {
    en: 'Technician assigned to inspect the issue',
    hi: 'जांच के लिए तकनीशियन नियुक्त किया गया है',
    es: 'Técnico asignado para inspeccionar el problema',
    fr: 'Technicien assigné pour inspecter le problème',
    de: 'Techniker mit der Überprüfung des Problems beauftragt',
    te: 'సమస్యను పరిశీలించడానికి టెక్నీషియన్ కేటాయించబడ్డారు',
    ta: 'சிக்கலை ஆய்வு செய்ய தொழில்நுட்ப வல்லுநர் நியமிக்கப்பட்டுள்ளார்',
    bn: 'সমস্যাটি পরিদর্শনের জন্য টেকনিশিয়ান নিয়োগ করা হয়েছে'
  },
  {
    en: 'Work in progress. Technician is on site.',
    hi: 'कार्य प्रगति पर है। तकनीशियन कमरे में उपस्थित है।',
    es: 'Trabajo en progreso. El técnico está en el lugar.',
    fr: 'Travaux en cours. Le technicien est sur place.',
    de: 'Arbeiten im Gange. Techniker vor Ort.',
    te: 'పని జరుగుతోంది. టెక్నీషియన్ సైట్‌లో ఉన్నారు.',
    ta: 'வேலை நடக்கிறது. தொழில்நுட்ப வல்லுநர் களத்தில் உள்ளார்.',
    bn: 'কাজ চলছে। টেকনিশিয়ান ঘটনাস্থলে উপস্থিত আছেন।'
  },
  {
    en: 'Repairs completed and tested successfully.',
    hi: 'मरम्मत सफलतापूर्वक पूरी कर ली गई है और परीक्षण किया गया।',
    es: 'Reparaciones completadas y probadas exitosamente.',
    fr: 'Réparations terminées et testées avec succès.',
    de: 'Reparaturen abgeschlossen und erfolgreich getestet.',
    te: 'మరమ్మతులు పూర్తయ్యాయి మరియు విజయవంతంగా పరీక్షించబడ్డాయి.',
    ta: 'பழுதுபார்ப்பு வெற்றிகரமாக முடிக்கப்பட்டு சோதிக்கப்பட்டது.',
    bn: 'মেরামত সফলভাবে সম্পন্ন এবং পরীক্ষা করা হয়েছে।'
  },
  {
    en: 'Ticket closed after student verification',
    hi: 'छात्र के सत्यापन के बाद टिकट बंद कर दिया गया',
    es: 'Boleto cerrado tras la verificación del estudiante',
    fr: 'Ticket fermé après vérification de l’étudiant',
    de: 'Ticket nach Bestätigung durch den Studenten geschlossen',
    te: 'విద్యార్థి ధృవీకరణ తర్వాత టికెట్ మూసివేయబడింది',
    ta: 'மாணவர் சரிபார்ப்பிற்குப் பிறகு டிக்கெட் மூடப்பட்டது',
    bn: 'শিক্ষার্থীর যাচাইয়ের পরে টিকিট বন্ধ করা হয়েছে'
  }
];

/**
 * Translates a status, category, or priority key into the target language.
 */
export const translateTerm = (key, lang = 'en') => {
  if (!key) return '';
  const upper = String(key).toUpperCase();
  if (CORE_TRANSLATIONS[upper] && CORE_TRANSLATIONS[upper][lang]) {
    return CORE_TRANSLATIONS[upper][lang];
  }
  return key;
};

/**
 * Translates a free-form maintenance text or work log into the target language.
 */
export const translateMaintenanceText = (text, lang = 'en') => {
  if (!text || lang === 'en') return text;

  // Check exact phrase matches
  const match = PHRASE_MAP.find(p => p.en.toLowerCase() === text.trim().toLowerCase());
  if (match && match[lang]) return match[lang];

  // Check partial phrase replacements
  let translated = text;
  PHRASE_MAP.forEach(p => {
    if (translated.toLowerCase().includes(p.en.toLowerCase()) && p[lang]) {
      translated = translated.replace(new RegExp(p.en, 'gi'), p[lang]);
    }
  });

  // If text already replaced, return
  if (translated !== text) return translated;

  // Smart contextual prefix for non-English users
  const languagePrefixes = {
    hi: 'अपडेट: ',
    es: 'Actualización: ',
    fr: 'Mise à jour: ',
    de: 'Aktualisierung: ',
    te: 'తాజా సమాచారం: ',
    ta: 'புதிய தகவல்: ',
    bn: 'হালনাগাদ: '
  };

  const prefix = languagePrefixes[lang] || '';
  return `${prefix}${text}`;
};

/**
 * Text-to-speech reader in the target language voice.
 */
export const speakText = (text, lang = 'en') => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel(); // Stop any previous speech

  const langObj = SUPPORTED_LANGUAGES.find(l => l.code === lang) || SUPPORTED_LANGUAGES[0];
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langObj.voiceCode;
  utterance.rate = 0.95;

  // Try to find native voice
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(v => v.lang.startsWith(langObj.code) || v.lang === langObj.voiceCode);
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  window.speechSynthesis.speak(utterance);
};

