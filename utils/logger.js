/**
 * Sistema di logging strutturato con timestamp
 *
 * Sostituisce console.log/error/warn con funzioni che aggiungono
 * automaticamente timestamp e livello di log per facilitare
 * il debugging su Render e altri ambienti di hosting.
 */

const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

/**
 * Formatta un timestamp ISO per i log
 * @returns {string} Timestamp in formato ISO
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Crea un messaggio di log formattato
 * @param {string} level - Livello di log (DEBUG, INFO, WARN, ERROR)
 * @param {Array} args - Argomenti da loggare
 * @returns {string} Messaggio formattato
 */
function formatLog(level, args) {
  return `[${getTimestamp()}] [${level}]`;
}

const logger = {
  /**
   * Log di debug (solo per sviluppo)
   */
  debug(...args) {
    console.log(formatLog(LOG_LEVELS.DEBUG), ...args);
  },

  /**
   * Log informativo (operazioni normali)
   */
  info(...args) {
    console.log(formatLog(LOG_LEVELS.INFO), ...args);
  },

  /**
   * Log di avviso (situazioni anomale ma non critiche)
   */
  warn(...args) {
    console.warn(formatLog(LOG_LEVELS.WARN), ...args);
  },

  /**
   * Log di errore (errori critici)
   */
  error(...args) {
    console.error(formatLog(LOG_LEVELS.ERROR), ...args);
  },
};

module.exports = logger;
