// Copyright 2026 TipFlow. Licensed under Apache 2.0.
// Lightweight i18n system — zero dependencies.

export type Locale = 'en' | 'es' | 'ar' | 'zh' | 'fr';

export interface LocaleInfo {
  code: Locale;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

export const LOCALES: LocaleInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '\u{1F1FA}\u{1F1F8}', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Espa\u00f1ol', flag: '\u{1F1EA}\u{1F1F8}', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629', flag: '\u{1F1F8}\u{1F1E6}', dir: 'rtl' },
  { code: 'zh', name: 'Chinese', nativeName: '\u4E2D\u6587', flag: '\u{1F1E8}\u{1F1F3}', dir: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Fran\u00e7ais', flag: '\u{1F1EB}\u{1F1F7}', dir: 'ltr' },
];

export const translations: Record<Locale, Record<string, string>> = {
  en: {
    // App
    'app.title': 'TipFlow',
    'app.subtitle': 'AI-Powered Multi-Chain Tipping',
    'app.footer': 'Built with',
    'app.footer.hackathon': 'Tether Hackathon Galactica 2026',

    // Navigation / Header
    'nav.history': 'History',
    'nav.settings': 'Settings',
    'nav.online': 'Online',
    'nav.offline': 'Offline',
    'nav.llmActive': 'LLM Active',
    'nav.ruleBased': 'Rule-based',

    // Theme & Sound
    'theme.dark': 'Switch to light mode',
    'theme.light': 'Switch to dark mode',
    'sound.mute': 'Mute sounds',
    'sound.enable': 'Enable sounds',
    'shortcuts.title': 'Keyboard shortcuts',

    // Wallet
    'wallet.title': 'Wallets',
    'wallet.balance': 'Balance',
    'wallet.nativeBalance': 'Native Balance',
    'wallet.usdtBalance': 'USDT Balance',
    'wallet.address': 'Address',
    'wallet.copy': 'Copy',
    'wallet.copied': 'Copied!',
    'wallet.testnet': 'Testnet',

    // Tip modes
    'tip.single': 'Single Tip',
    'tip.batch': 'Batch Tip',
    'tip.split': 'Split',

    // TipForm
    'tip.send': 'Send Tip',
    'tip.amount': 'Amount',
    'tip.recipient': 'Recipient Address',
    'tip.token': 'Token',
    'tip.chain': 'Chain Preference',
    'tip.chainAuto': 'Auto (AI decides)',
    'tip.chainOptional': 'optional \u2014 agent decides if empty',
    'tip.message': 'Message',
    'tip.messageOptional': 'optional',
    'tip.messagePlaceholder': 'Great work on the PR!',
    'tip.success': 'Tip sent successfully!',
    'tip.failed': 'Tip failed',
    'tip.sending': 'Agent Processing...',
    'tip.scheduling': 'Scheduling...',
    'tip.sendingGasless': 'Sending Gasless...',

    // NLP
    'nlp.label': 'Natural Language Command',
    'nlp.placeholder': 'e.g. "send 0.01 ETH to 0x..."',
    'nlp.parse': 'Parse',
    'nlp.hint': 'Try: "send 0.01 ETH to 0x..." \u00B7 "tip 5 USDT to 0x..." \u00B7 "transfer 0.1 TON to UQ..."',
    'nlp.orManual': 'or fill manually',

    // Schedule
    'tip.schedule': 'Schedule for later',
    'tip.scheduleTip': 'Schedule Tip',
    'tip.recurring': 'Recurring',
    'tip.daily': 'Daily',
    'tip.weekly': 'Weekly',
    'tip.monthly': 'Monthly',

    // Gasless
    'tip.gasless': 'Send Gasless Tip',

    // Contacts
    'contacts.title': 'Contacts',
    'contacts.save': 'Save',
    'contacts.saveToContacts': 'Save to contacts',
    'contacts.namePlaceholder': 'Contact name...',
    'contacts.remove': 'Remove contact',

    // Templates
    'template.save': 'Save as Template',
    'template.namePlaceholder': 'Template name...',

    // Agent
    'agent.thinking': 'Agent is thinking...',
    'agent.executing': 'Executing transaction...',
    'agent.confirmed': 'Transaction confirmed',

    // Chat
    'chat.placeholder': 'Type a message...',
    'chat.send': 'Send',

    // Scheduled tips
    'scheduled.title': 'Scheduled Tips',
    'scheduled.pending': 'pending',
    'scheduled.cancel': 'Cancel scheduled tip',

    // History
    'history.title': 'Transaction History',
    'history.empty': 'No transactions yet',

    // Stats
    'stats.title': 'Statistics',
    'stats.totalTips': 'Total Tips',

    // Navigation tabs
    'nav.dashboard': 'Dashboard',
    'nav.analytics': 'Analytics',
    'nav.rumble': 'Rumble',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.retry': 'Retry',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.confirm': 'Confirm',
    'common.search': 'Search',
    'common.export': 'Export',
    'common.import': 'Import',

    // Agent extra
    'agent.analyzing': 'Analyzing...',
    'agent.verifying': 'Verifying...',
    'agent.complete': 'Complete',

    // Settings
    'settings.theme': 'Theme',
    'settings.language': 'Language',
    'settings.sound': 'Sound',
    'settings.personality': 'Personality',

    // Language
    'language.select': 'Language',
  },

  es: {
    'app.title': 'TipFlow',
    'app.subtitle': 'Agente de Propinas con IA',
    'app.footer': 'Construido con',
    'app.footer.hackathon': 'Tether Hackathon Galactica 2026',

    'nav.history': 'Historial',
    'nav.settings': 'Configuraci\u00F3n',
    'nav.online': 'En l\u00EDnea',
    'nav.offline': 'Desconectado',
    'nav.llmActive': 'LLM Activo',
    'nav.ruleBased': 'Basado en reglas',

    'theme.dark': 'Cambiar a modo claro',
    'theme.light': 'Cambiar a modo oscuro',
    'sound.mute': 'Silenciar sonidos',
    'sound.enable': 'Activar sonidos',
    'shortcuts.title': 'Atajos de teclado',

    'wallet.title': 'Billeteras',
    'wallet.balance': 'Saldo',
    'wallet.nativeBalance': 'Saldo Nativo',
    'wallet.usdtBalance': 'Saldo USDT',
    'wallet.address': 'Direcci\u00F3n',
    'wallet.copy': 'Copiar',
    'wallet.copied': '\u00A1Copiado!',
    'wallet.testnet': 'Red de prueba',

    'tip.single': 'Propina Individual',
    'tip.batch': 'Propina Grupal',
    'tip.split': 'Dividir',

    'tip.send': 'Enviar Propina',
    'tip.amount': 'Cantidad',
    'tip.recipient': 'Direcci\u00F3n del Destinatario',
    'tip.token': 'Token',
    'tip.chain': 'Preferencia de Cadena',
    'tip.chainAuto': 'Auto (IA decide)',
    'tip.chainOptional': 'opcional \u2014 el agente decide si est\u00E1 vac\u00EDo',
    'tip.message': 'Mensaje',
    'tip.messageOptional': 'opcional',
    'tip.messagePlaceholder': '\u00A1Buen trabajo en el PR!',
    'tip.success': '\u00A1Propina enviada con \u00E9xito!',
    'tip.failed': 'Propina fallida',
    'tip.sending': 'Agente procesando...',
    'tip.scheduling': 'Programando...',
    'tip.sendingGasless': 'Enviando sin gas...',

    'nlp.label': 'Comando en Lenguaje Natural',
    'nlp.placeholder': 'ej. "enviar 0.01 ETH a 0x..."',
    'nlp.parse': 'Analizar',
    'nlp.hint': 'Prueba: "enviar 0.01 ETH a 0x..." \u00B7 "propina 5 USDT a 0x..."',
    'nlp.orManual': 'o llenar manualmente',

    'tip.schedule': 'Programar para despu\u00E9s',
    'tip.scheduleTip': 'Programar Propina',
    'tip.recurring': 'Recurrente',
    'tip.daily': 'Diario',
    'tip.weekly': 'Semanal',
    'tip.monthly': 'Mensual',

    'tip.gasless': 'Enviar Propina sin Gas',

    'contacts.title': 'Contactos',
    'contacts.save': 'Guardar',
    'contacts.saveToContacts': 'Guardar en contactos',
    'contacts.namePlaceholder': 'Nombre del contacto...',
    'contacts.remove': 'Eliminar contacto',

    'template.save': 'Guardar como Plantilla',
    'template.namePlaceholder': 'Nombre de la plantilla...',

    'agent.thinking': 'El agente est\u00E1 pensando...',
    'agent.executing': 'Ejecutando transacci\u00F3n...',
    'agent.confirmed': 'Transacci\u00F3n confirmada',

    'chat.placeholder': 'Escribe un mensaje...',
    'chat.send': 'Enviar',

    'scheduled.title': 'Propinas Programadas',
    'scheduled.pending': 'pendientes',
    'scheduled.cancel': 'Cancelar propina programada',

    'history.title': 'Historial de Transacciones',
    'history.empty': 'A\u00FAn no hay transacciones',

    'stats.title': 'Estad\u00EDsticas',
    'stats.totalTips': 'Total de Propinas',

    'nav.dashboard': 'Panel',
    'nav.analytics': 'Anal\u00EDtica',
    'nav.rumble': 'Rumble',

    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.retry': 'Reintentar',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.delete': 'Eliminar',
    'common.confirm': 'Confirmar',
    'common.search': 'Buscar',
    'common.export': 'Exportar',
    'common.import': 'Importar',

    'agent.analyzing': 'Analizando...',
    'agent.verifying': 'Verificando...',
    'agent.complete': 'Completado',

    'settings.theme': 'Tema',
    'settings.language': 'Idioma',
    'settings.sound': 'Sonido',
    'settings.personality': 'Personalidad',

    'language.select': 'Idioma',
  },

  ar: {
    'app.title': 'TipFlow',
    'app.subtitle': '\u0648\u0643\u064A\u0644 \u0627\u0644\u0625\u0643\u0631\u0627\u0645\u064A\u0627\u062A \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A',
    'app.footer': '\u0628\u064F\u0646\u064A \u0628\u0627\u0633\u062A\u062E\u062F\u0627\u0645',
    'app.footer.hackathon': 'Tether Hackathon Galactica 2026',

    'nav.history': '\u0627\u0644\u0633\u062C\u0644',
    'nav.settings': '\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A',
    'nav.online': '\u0645\u062A\u0635\u0644',
    'nav.offline': '\u063A\u064A\u0631 \u0645\u062A\u0635\u0644',
    'nav.llmActive': 'LLM \u0646\u0634\u0637',
    'nav.ruleBased': '\u0642\u0627\u0626\u0645 \u0639\u0644\u0649 \u0627\u0644\u0642\u0648\u0627\u0639\u062F',

    'theme.dark': '\u0627\u0644\u062A\u0628\u062F\u064A\u0644 \u0625\u0644\u0649 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0641\u0627\u062A\u062D',
    'theme.light': '\u0627\u0644\u062A\u0628\u062F\u064A\u0644 \u0625\u0644\u0649 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u062F\u0627\u0643\u0646',
    'sound.mute': '\u0643\u062A\u0645 \u0627\u0644\u0623\u0635\u0648\u0627\u062A',
    'sound.enable': '\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0623\u0635\u0648\u0627\u062A',
    'shortcuts.title': '\u0627\u062E\u062A\u0635\u0627\u0631\u0627\u062A \u0627\u0644\u0644\u0648\u062D\u0629',

    'wallet.title': '\u0627\u0644\u0645\u062D\u0627\u0641\u0638',
    'wallet.balance': '\u0627\u0644\u0631\u0635\u064A\u062F',
    'wallet.nativeBalance': '\u0627\u0644\u0631\u0635\u064A\u062F \u0627\u0644\u0623\u0635\u0644\u064A',
    'wallet.usdtBalance': '\u0631\u0635\u064A\u062F USDT',
    'wallet.address': '\u0627\u0644\u0639\u0646\u0648\u0627\u0646',
    'wallet.copy': '\u0646\u0633\u062E',
    'wallet.copied': '\u062A\u0645 \u0627\u0644\u0646\u0633\u062E!',
    'wallet.testnet': '\u0634\u0628\u0643\u0629 \u0627\u0644\u0627\u062E\u062A\u0628\u0627\u0631',

    'tip.single': '\u0625\u0643\u0631\u0627\u0645\u064A\u0629 \u0641\u0631\u062F\u064A\u0629',
    'tip.batch': '\u0625\u0643\u0631\u0627\u0645\u064A\u0629 \u062C\u0645\u0627\u0639\u064A\u0629',
    'tip.split': '\u062A\u0642\u0633\u064A\u0645',

    'tip.send': '\u0625\u0631\u0633\u0627\u0644 \u0625\u0643\u0631\u0627\u0645\u064A\u0629',
    'tip.amount': '\u0627\u0644\u0645\u0628\u0644\u063A',
    'tip.recipient': '\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0645\u0633\u062A\u0644\u0645',
    'tip.token': '\u0627\u0644\u0631\u0645\u0632',
    'tip.chain': '\u062A\u0641\u0636\u064A\u0644 \u0627\u0644\u0633\u0644\u0633\u0644\u0629',
    'tip.chainAuto': '\u062A\u0644\u0642\u0627\u0626\u064A (\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u064A\u0642\u0631\u0631)',
    'tip.chainOptional': '\u0627\u062E\u062A\u064A\u0627\u0631\u064A \u2014 \u0627\u0644\u0648\u0643\u064A\u0644 \u064A\u0642\u0631\u0631 \u0625\u0630\u0627 \u0643\u0627\u0646 \u0641\u0627\u0631\u063A\u064B\u0627',
    'tip.message': '\u0631\u0633\u0627\u0644\u0629',
    'tip.messageOptional': '\u0627\u062E\u062A\u064A\u0627\u0631\u064A',
    'tip.messagePlaceholder': '\u0639\u0645\u0644 \u0631\u0627\u0626\u0639!',
    'tip.success': '\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0625\u0643\u0631\u0627\u0645\u064A\u0629 \u0628\u0646\u062C\u0627\u062D!',
    'tip.failed': '\u0641\u0634\u0644\u062A \u0627\u0644\u0625\u0643\u0631\u0627\u0645\u064A\u0629',
    'tip.sending': '\u0627\u0644\u0648\u0643\u064A\u0644 \u064A\u0639\u0627\u0644\u062C...',
    'tip.scheduling': '\u062C\u0627\u0631\u064A \u0627\u0644\u062C\u062F\u0648\u0644\u0629...',
    'tip.sendingGasless': '\u0625\u0631\u0633\u0627\u0644 \u0628\u062F\u0648\u0646 \u063A\u0627\u0632...',

    'nlp.label': '\u0623\u0645\u0631 \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0637\u0628\u064A\u0639\u064A\u0629',
    'nlp.placeholder': '\u0645\u062B\u0627\u0644: "\u0623\u0631\u0633\u0644 0.01 ETH \u0625\u0644\u0649 0x..."',
    'nlp.parse': '\u062A\u062D\u0644\u064A\u0644',
    'nlp.hint': '\u062C\u0631\u0628: "\u0623\u0631\u0633\u0644 0.01 ETH \u0625\u0644\u0649 0x..."',
    'nlp.orManual': '\u0623\u0648 \u0627\u0645\u0644\u0623 \u064A\u062F\u0648\u064A\u064B\u0627',

    'tip.schedule': '\u062C\u062F\u0648\u0644\u0629 \u0644\u0627\u062D\u0642\u064B\u0627',
    'tip.scheduleTip': '\u062C\u062F\u0648\u0644\u0629 \u0627\u0644\u0625\u0643\u0631\u0627\u0645\u064A\u0629',
    'tip.recurring': '\u0645\u062A\u0643\u0631\u0631',
    'tip.daily': '\u064A\u0648\u0645\u064A',
    'tip.weekly': '\u0623\u0633\u0628\u0648\u0639\u064A',
    'tip.monthly': '\u0634\u0647\u0631\u064A',

    'tip.gasless': '\u0625\u0631\u0633\u0627\u0644 \u0625\u0643\u0631\u0627\u0645\u064A\u0629 \u0628\u062F\u0648\u0646 \u063A\u0627\u0632',

    'contacts.title': '\u062C\u0647\u0627\u062A \u0627\u0644\u0627\u062A\u0635\u0627\u0644',
    'contacts.save': '\u062D\u0641\u0638',
    'contacts.saveToContacts': '\u062D\u0641\u0638 \u0641\u064A \u062C\u0647\u0627\u062A \u0627\u0644\u0627\u062A\u0635\u0627\u0644',
    'contacts.namePlaceholder': '\u0627\u0633\u0645 \u062C\u0647\u0629 \u0627\u0644\u0627\u062A\u0635\u0627\u0644...',
    'contacts.remove': '\u0625\u0632\u0627\u0644\u0629 \u062C\u0647\u0629 \u0627\u0644\u0627\u062A\u0635\u0627\u0644',

    'template.save': '\u062D\u0641\u0638 \u0643\u0642\u0627\u0644\u0628',
    'template.namePlaceholder': '\u0627\u0633\u0645 \u0627\u0644\u0642\u0627\u0644\u0628...',

    'agent.thinking': '\u0627\u0644\u0648\u0643\u064A\u0644 \u064A\u0641\u0643\u0631...',
    'agent.executing': '\u062C\u0627\u0631\u064A \u062A\u0646\u0641\u064A\u0630 \u0627\u0644\u0645\u0639\u0627\u0645\u0644\u0629...',
    'agent.confirmed': '\u062A\u0645 \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0645\u0639\u0627\u0645\u0644\u0629',

    'chat.placeholder': '\u0627\u0643\u062A\u0628 \u0631\u0633\u0627\u0644\u0629...',
    'chat.send': '\u0625\u0631\u0633\u0627\u0644',

    'scheduled.title': '\u0627\u0644\u0625\u0643\u0631\u0627\u0645\u064A\u0627\u062A \u0627\u0644\u0645\u062C\u062F\u0648\u0644\u0629',
    'scheduled.pending': '\u0642\u064A\u062F \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631',
    'scheduled.cancel': '\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0625\u0643\u0631\u0627\u0645\u064A\u0629 \u0627\u0644\u0645\u062C\u062F\u0648\u0644\u0629',

    'history.title': '\u0633\u062C\u0644 \u0627\u0644\u0645\u0639\u0627\u0645\u0644\u0627\u062A',
    'history.empty': '\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0639\u0627\u0645\u0644\u0627\u062A \u0628\u0639\u062F',

    'stats.title': '\u0627\u0644\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A',
    'stats.totalTips': '\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0625\u0643\u0631\u0627\u0645\u064A\u0627\u062A',

    'nav.dashboard': '\u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645',
    'nav.analytics': '\u0627\u0644\u062A\u062D\u0644\u064A\u0644\u0627\u062A',
    'nav.rumble': 'Rumble',

    'common.loading': '\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644...',
    'common.error': '\u062E\u0637\u0623',
    'common.retry': '\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629',
    'common.cancel': '\u0625\u0644\u063A\u0627\u0621',
    'common.save': '\u062D\u0641\u0638',
    'common.delete': '\u062D\u0630\u0641',
    'common.confirm': '\u062A\u0623\u0643\u064A\u062F',
    'common.search': '\u0628\u062D\u062B',
    'common.export': '\u062A\u0635\u062F\u064A\u0631',
    'common.import': '\u0627\u0633\u062A\u064A\u0631\u0627\u062F',

    'agent.analyzing': '\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0644\u064A\u0644...',
    'agent.verifying': '\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0642\u0642...',
    'agent.complete': '\u0645\u0643\u062A\u0645\u0644',

    'settings.theme': '\u0627\u0644\u0645\u0638\u0647\u0631',
    'settings.language': '\u0627\u0644\u0644\u063A\u0629',
    'settings.sound': '\u0627\u0644\u0635\u0648\u062A',
    'settings.personality': '\u0627\u0644\u0634\u062E\u0635\u064A\u0629',

    'language.select': '\u0627\u0644\u0644\u063A\u0629',
  },

  zh: {
    'app.title': 'TipFlow',
    'app.subtitle': 'AI\u9A71\u52A8\u7684\u591A\u94FE\u6253\u8D4F\u4EE3\u7406',
    'app.footer': '\u6784\u5EFA\u4E8E',
    'app.footer.hackathon': 'Tether Hackathon Galactica 2026',

    'nav.history': '\u5386\u53F2\u8BB0\u5F55',
    'nav.settings': '\u8BBE\u7F6E',
    'nav.online': '\u5728\u7EBF',
    'nav.offline': '\u79BB\u7EBF',
    'nav.llmActive': 'LLM \u5DF2\u6FC0\u6D3B',
    'nav.ruleBased': '\u57FA\u4E8E\u89C4\u5219',

    'theme.dark': '\u5207\u6362\u5230\u6D45\u8272\u6A21\u5F0F',
    'theme.light': '\u5207\u6362\u5230\u6DF1\u8272\u6A21\u5F0F',
    'sound.mute': '\u9759\u97F3',
    'sound.enable': '\u542F\u7528\u58F0\u97F3',
    'shortcuts.title': '\u952E\u76D8\u5FEB\u6377\u952E',

    'wallet.title': '\u94B1\u5305',
    'wallet.balance': '\u4F59\u989D',
    'wallet.nativeBalance': '\u539F\u751F\u4F59\u989D',
    'wallet.usdtBalance': 'USDT \u4F59\u989D',
    'wallet.address': '\u5730\u5740',
    'wallet.copy': '\u590D\u5236',
    'wallet.copied': '\u5DF2\u590D\u5236\uFF01',
    'wallet.testnet': '\u6D4B\u8BD5\u7F51',

    'tip.single': '\u5355\u7B14\u6253\u8D4F',
    'tip.batch': '\u6279\u91CF\u6253\u8D4F',
    'tip.split': '\u5206\u644A',

    'tip.send': '\u53D1\u9001\u6253\u8D4F',
    'tip.amount': '\u91D1\u989D',
    'tip.recipient': '\u6536\u6B3E\u5730\u5740',
    'tip.token': '\u4EE3\u5E01',
    'tip.chain': '\u94FE\u504F\u597D',
    'tip.chainAuto': '\u81EA\u52A8\uFF08AI \u51B3\u5B9A\uFF09',
    'tip.chainOptional': '\u53EF\u9009 \u2014 \u7559\u7A7A\u7531\u4EE3\u7406\u51B3\u5B9A',
    'tip.message': '\u6D88\u606F',
    'tip.messageOptional': '\u53EF\u9009',
    'tip.messagePlaceholder': 'PR \u505A\u5F97\u5F88\u68D2\uFF01',
    'tip.success': '\u6253\u8D4F\u53D1\u9001\u6210\u529F\uFF01',
    'tip.failed': '\u6253\u8D4F\u5931\u8D25',
    'tip.sending': '\u4EE3\u7406\u5904\u7406\u4E2D...',
    'tip.scheduling': '\u8BA1\u5212\u4E2D...',
    'tip.sendingGasless': '\u65E0Gas\u53D1\u9001\u4E2D...',

    'nlp.label': '\u81EA\u7136\u8BED\u8A00\u547D\u4EE4',
    'nlp.placeholder': '\u4F8B\u5982\uFF1A"\u53D1\u9001 0.01 ETH \u5230 0x..."',
    'nlp.parse': '\u89E3\u6790',
    'nlp.hint': '\u8BD5\u8BD5\uFF1A"\u53D1\u9001 0.01 ETH \u5230 0x..."',
    'nlp.orManual': '\u6216\u624B\u52A8\u586B\u5199',

    'tip.schedule': '\u5B9A\u65F6\u53D1\u9001',
    'tip.scheduleTip': '\u8BA1\u5212\u6253\u8D4F',
    'tip.recurring': '\u91CD\u590D',
    'tip.daily': '\u6BCF\u5929',
    'tip.weekly': '\u6BCF\u5468',
    'tip.monthly': '\u6BCF\u6708',

    'tip.gasless': '\u65E0Gas\u53D1\u9001\u6253\u8D4F',

    'contacts.title': '\u8054\u7CFB\u4EBA',
    'contacts.save': '\u4FDD\u5B58',
    'contacts.saveToContacts': '\u4FDD\u5B58\u5230\u8054\u7CFB\u4EBA',
    'contacts.namePlaceholder': '\u8054\u7CFB\u4EBA\u540D\u79F0...',
    'contacts.remove': '\u5220\u9664\u8054\u7CFB\u4EBA',

    'template.save': '\u4FDD\u5B58\u4E3A\u6A21\u677F',
    'template.namePlaceholder': '\u6A21\u677F\u540D\u79F0...',

    'agent.thinking': '\u4EE3\u7406\u601D\u8003\u4E2D...',
    'agent.executing': '\u6267\u884C\u4EA4\u6613\u4E2D...',
    'agent.confirmed': '\u4EA4\u6613\u5DF2\u786E\u8BA4',

    'chat.placeholder': '\u8F93\u5165\u6D88\u606F...',
    'chat.send': '\u53D1\u9001',

    'scheduled.title': '\u8BA1\u5212\u6253\u8D4F',
    'scheduled.pending': '\u5F85\u5904\u7406',
    'scheduled.cancel': '\u53D6\u6D88\u8BA1\u5212\u6253\u8D4F',

    'history.title': '\u4EA4\u6613\u5386\u53F2',
    'history.empty': '\u6682\u65E0\u4EA4\u6613',

    'stats.title': '\u7EDF\u8BA1',
    'stats.totalTips': '\u6253\u8D4F\u603B\u8BA1',

    'nav.dashboard': '\u4EEA\u8868\u76D8',
    'nav.analytics': '\u5206\u6790',
    'nav.rumble': 'Rumble',

    'common.loading': '\u52A0\u8F7D\u4E2D...',
    'common.error': '\u9519\u8BEF',
    'common.retry': '\u91CD\u8BD5',
    'common.cancel': '\u53D6\u6D88',
    'common.save': '\u4FDD\u5B58',
    'common.delete': '\u5220\u9664',
    'common.confirm': '\u786E\u8BA4',
    'common.search': '\u641C\u7D22',
    'common.export': '\u5BFC\u51FA',
    'common.import': '\u5BFC\u5165',

    'agent.analyzing': '\u5206\u6790\u4E2D...',
    'agent.verifying': '\u9A8C\u8BC1\u4E2D...',
    'agent.complete': '\u5B8C\u6210',

    'settings.theme': '\u4E3B\u9898',
    'settings.language': '\u8BED\u8A00',
    'settings.sound': '\u58F0\u97F3',
    'settings.personality': '\u4E2A\u6027',

    'language.select': '\u8BED\u8A00',
  },

  fr: {
    'app.title': 'TipFlow',
    'app.subtitle': 'Agent de Pourboires aliment\u00E9 par l\'IA',
    'app.footer': 'Construit avec',
    'app.footer.hackathon': 'Tether Hackathon Galactica 2026',

    'nav.history': 'Historique',
    'nav.settings': 'Param\u00E8tres',
    'nav.online': 'En ligne',
    'nav.offline': 'Hors ligne',
    'nav.llmActive': 'LLM Actif',
    'nav.ruleBased': 'Bas\u00E9 sur des r\u00E8gles',

    'theme.dark': 'Passer en mode clair',
    'theme.light': 'Passer en mode sombre',
    'sound.mute': 'Couper le son',
    'sound.enable': 'Activer le son',
    'shortcuts.title': 'Raccourcis clavier',

    'wallet.title': 'Portefeuilles',
    'wallet.balance': 'Solde',
    'wallet.nativeBalance': 'Solde Natif',
    'wallet.usdtBalance': 'Solde USDT',
    'wallet.address': 'Adresse',
    'wallet.copy': 'Copier',
    'wallet.copied': 'Copi\u00E9 !',
    'wallet.testnet': 'Testnet',

    'tip.single': 'Pourboire Unique',
    'tip.batch': 'Pourboire Groupé',
    'tip.split': 'Diviser',

    'tip.send': 'Envoyer un Pourboire',
    'tip.amount': 'Montant',
    'tip.recipient': 'Adresse du Destinataire',
    'tip.token': 'Jeton',
    'tip.chain': 'Pr\u00E9f\u00E9rence de Cha\u00EEne',
    'tip.chainAuto': 'Auto (l\'IA d\u00E9cide)',
    'tip.chainOptional': 'optionnel \u2014 l\'agent d\u00E9cide si vide',
    'tip.message': 'Message',
    'tip.messageOptional': 'optionnel',
    'tip.messagePlaceholder': 'Excellent travail sur le PR !',
    'tip.success': 'Pourboire envoy\u00E9 avec succ\u00E8s !',
    'tip.failed': '\u00C9chec du pourboire',
    'tip.sending': 'Agent en cours de traitement...',
    'tip.scheduling': 'Planification...',
    'tip.sendingGasless': 'Envoi sans frais de gas...',

    'nlp.label': 'Commande en Langage Naturel',
    'nlp.placeholder': 'ex. "envoyer 0.01 ETH \u00E0 0x..."',
    'nlp.parse': 'Analyser',
    'nlp.hint': 'Essayez: "envoyer 0.01 ETH \u00E0 0x..."',
    'nlp.orManual': 'ou remplir manuellement',

    'tip.schedule': 'Planifier pour plus tard',
    'tip.scheduleTip': 'Planifier le Pourboire',
    'tip.recurring': 'R\u00E9current',
    'tip.daily': 'Quotidien',
    'tip.weekly': 'Hebdomadaire',
    'tip.monthly': 'Mensuel',

    'tip.gasless': 'Envoyer sans frais de gas',

    'contacts.title': 'Contacts',
    'contacts.save': 'Enregistrer',
    'contacts.saveToContacts': 'Enregistrer dans les contacts',
    'contacts.namePlaceholder': 'Nom du contact...',
    'contacts.remove': 'Supprimer le contact',

    'template.save': 'Enregistrer comme Mod\u00E8le',
    'template.namePlaceholder': 'Nom du mod\u00E8le...',

    'agent.thinking': 'L\'agent r\u00E9fl\u00E9chit...',
    'agent.executing': 'Ex\u00E9cution de la transaction...',
    'agent.confirmed': 'Transaction confirm\u00E9e',

    'chat.placeholder': 'Tapez un message...',
    'chat.send': 'Envoyer',

    'scheduled.title': 'Pourboires Planifi\u00E9s',
    'scheduled.pending': 'en attente',
    'scheduled.cancel': 'Annuler le pourboire planifi\u00E9',

    'history.title': 'Historique des Transactions',
    'history.empty': 'Aucune transaction pour le moment',

    'stats.title': 'Statistiques',
    'stats.totalTips': 'Total des Pourboires',

    'nav.dashboard': 'Tableau de bord',
    'nav.analytics': 'Analytique',
    'nav.rumble': 'Rumble',

    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.retry': 'R\u00E9essayer',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.delete': 'Supprimer',
    'common.confirm': 'Confirmer',
    'common.search': 'Rechercher',
    'common.export': 'Exporter',
    'common.import': 'Importer',

    'agent.analyzing': 'Analyse en cours...',
    'agent.verifying': 'V\u00E9rification...',
    'agent.complete': 'Termin\u00E9',

    'settings.theme': 'Th\u00E8me',
    'settings.language': 'Langue',
    'settings.sound': 'Son',
    'settings.personality': 'Personnalit\u00E9',

    'language.select': 'Langue',
  },
};

const STORAGE_KEY = 'tipflow-locale';

export function getStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in translations) return stored as Locale;
  } catch {
    // SSR or private browsing
  }
  return 'en';
}

export function storeLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore
  }
}

export function getLocaleInfo(code: Locale): LocaleInfo {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0];
}

/** Simple translate function for a given locale. Falls back to English, then returns the key. */
export function translate(locale: Locale, key: string): string {
  return translations[locale]?.[key] ?? translations.en[key] ?? key;
}

/** Apply text direction and lang attribute based on locale */
export function applyLocaleDirection(locale: Locale): void {
  const info = getLocaleInfo(locale);
  document.documentElement.setAttribute('dir', info.dir);
  document.documentElement.setAttribute('lang', locale);
}

// ---------------------------------------------------------------------------
// Reactive locale state — lightweight pub/sub so components re-render on change
// ---------------------------------------------------------------------------

type LocaleListener = (locale: Locale) => void;
const listeners = new Set<LocaleListener>();

let currentLocale: Locale = getStoredLocale();

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  if (locale === currentLocale) return;
  currentLocale = locale;
  storeLocale(locale);
  applyLocaleDirection(locale);
  listeners.forEach((fn) => fn(locale));
}

export function subscribe(fn: LocaleListener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/** Shorthand: translate using the current global locale */
export function t(key: string): string {
  return translate(currentLocale, key);
}

// Apply direction on initial load
applyLocaleDirection(currentLocale);
