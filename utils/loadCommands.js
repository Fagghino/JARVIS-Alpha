/**
 * Utility per il caricamento ricorsivo dei comandi slash
 *
 * Modulo condiviso tra index.js e deploy-commands.js
 * per evitare duplicazione della logica di caricamento.
 */

const fs = require('fs');
const path = require('path');

/**
 * Carica ricorsivamente tutti i comandi dalle directory
 * @param {string} dir - Percorso della directory da cui caricare i comandi
 * @param {Object} stats - Oggetto per tracciare i risultati del caricamento
 * @param {string[]} stats.loaded - Nomi dei comandi caricati con successo
 * @param {Array} stats.failed - Comandi che hanno dato errore [{file, error}]
 * @param {string[]} [stats.invalid] - Comandi con formato invalido (solo deploy)
 * @returns {Array} Array di comandi caricati con successo
 */
function loadCommandsFromDir(dir, stats = { loaded: [], failed: [], invalid: [] }) {
  const commands = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Esplora ricorsivamente le sottocartelle
      commands.push(...loadCommandsFromDir(filePath, stats));
    } else if (file.endsWith('.js')) {
      // Carica il comando se è un file .js valido
      try {
        const command = require(filePath);

        if (command.data && command.execute) {
          command.filePath = filePath;
          commands.push(command);
          stats.loaded.push(command.data.name);
        } else if (command.data && command.data.name) {
          // Ha data.name ma non execute — valido per deploy ma non per runtime
          commands.push(command);
          stats.loaded.push(command.data.name);
        } else {
          if (stats.invalid) stats.invalid.push(file);
        }
      } catch (error) {
        stats.failed.push({ file, error: error.message });
      }
    }
  }

  return commands;
}

/**
 * Stampa il riepilogo del caricamento comandi in console
 * @param {Object} stats - Statistiche di caricamento
 * @param {string} label - Etichetta per il contesto (es. "Registrazione", "Caricamento")
 */
function printLoadStats(stats, label = 'Caricamento') {
  if (stats.failed.length === 0 && (!stats.invalid || stats.invalid.length === 0)) {
    console.log(`✅ ${label}: ${stats.loaded.length} comandi caricati con successo`);
  } else {
    console.log(`⚠️  ${label}: ${stats.loaded.length} comandi pronti`);
    if (stats.invalid && stats.invalid.length > 0) {
      console.log(`   ⚠️  ${stats.invalid.length} comandi con formato invalido: ${stats.invalid.join(', ')}`);
    }
    if (stats.failed.length > 0) {
      console.log(`   ❌ ${stats.failed.length} comandi non caricati:`);
      stats.failed.forEach(f => console.log(`      • ${f.file}: ${f.error}`));
    }
  }
}

module.exports = { loadCommandsFromDir, printLoadStats };
