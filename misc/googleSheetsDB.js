/**
 * GoogleSheetsDB - Database persistente basato su Google Sheets
 *
 * Utilizzato per salvare i dati XP degli utenti su Google Sheets,
 * permettendo la persistenza dei dati anche su hosting gratuiti come Render.
 */

const { auth, sheets: sheetsFactory } = require('@googleapis/sheets');
const path = require('path');

/**
 * Classe per gestire il database XP su Google Sheets
 */
class GoogleSheetsDB {
  /**
   * @param {string} spreadsheetId - ID del foglio Google Sheets
   * @param {string} sheetName - Nome del foglio all'interno dello spreadsheet
   */
  constructor(spreadsheetId, sheetName = 'JARVIS') {
    this.spreadsheetId = spreadsheetId;
    this.sheetName = sheetName;
    this.sheets = null;
    this.initialized = false;
  }

  /**
   * Inizializza la connessione a Google Sheets API
   * Carica le credenziali e verifica/crea il foglio se necessario
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Autenticazione con Google Sheets API usando le credenziali
      const googleAuth = new auth.GoogleAuth({
        keyFile: path.join(__dirname, '../config/credentials.json'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const authClient = await googleAuth.getClient();
      this.sheets = sheetsFactory({ version: 'v4', auth: authClient });

      // Verifica che il foglio esista, altrimenti lo crea
      await this.ensureSheetExists();

      this.initialized = true;
      console.log(`✅ Connesso a Google Sheets - Foglio: ${this.sheetName}`);
    } catch (error) {
      console.error('❌ Errore connessione Google Sheets:', error.message);
      throw error;
    }
  }

  /**
   * Verifica che il foglio esista, altrimenti lo crea con le intestazioni
   */
  async ensureSheetExists() {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      // Controlla se il foglio esiste già
      const sheetExists = response.data.sheets.some(
        sheet => sheet.properties.title === this.sheetName
      );

      if (!sheetExists) {
        // Crea il nuovo foglio
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: {
            requests: [{
              addSheet: {
                properties: {
                  title: this.sheetName,
                },
              },
            }],
          },
        });

        // Determina le intestazioni in base al tipo di foglio
        let headers;
        let range;
        if (this.sheetName.includes('Reaction Roles')) {
          headers = [['guildId', 'channelId', 'messageId', 'title', 'rolesJson']];
          range = `${this.sheetName}!A1:E1`;
        } else {
          // Foglio XP utenti (default)
          headers = [['username', 'ID', 'XP', 'level']];
          range = `${this.sheetName}!A1:D1`;
        }

        // Aggiungi le intestazioni delle colonne
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: range,
          valueInputOption: 'RAW',
          resource: {
            values: headers,
          },
        });

        console.log(`✅ Foglio "${this.sheetName}" creato con successo`);
      }
    } catch (error) {
      console.error('❌ Errore verifica/creazione foglio:', error.message);
      throw error;
    }
  }

  /**
   * Carica tutti i dati XP dal foglio Google Sheets
   * @returns {Promise<Object>} Oggetto con userID come chiave e {xp, level} come valore
   */
  async loadXPData() {
    await this.initialize();

    try {
      // Legge le colonne B, C, D (ID, XP, level) dalla riga 2 in poi
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!B2:D`,
      });

      const rows = response.data.values || [];
      const xpData = {};

      // Converte i dati in un oggetto indicizzato per ID utente
      rows.forEach(row => {
        if (row[0]) {
          xpData[row[0]] = {
            xp: parseInt(row[1]) || 0,
            level: parseInt(row[2]) || 0,
          };
        }
      });

      return xpData;
    } catch (error) {
      console.error('❌ Errore caricamento XP:', error.message);
      return {};
    }
  }

  /**
   * Salva tutti i dati XP su Google Sheets
   * @param {Object} xpData - Oggetto con userID come chiave e {xp, level} come valore
   * @param {Object} guild - Oggetto guild di Discord per ottenere username
   * @returns {Promise<boolean>} true se il salvataggio ha successo
   */
  async saveXPData(xpData, guild) {
    await this.initialize();

    try {
      const rows = [['username', 'ID', 'XP', 'level']];

      // Costruisce le righe con i dati degli utenti
      Object.keys(xpData).forEach(userID => {
        const username = guild ? guild.members.cache.get(userID)?.user?.username || 'Unknown' : 'Unknown';
        rows.push([
          username,
          userID,
          xpData[userID].xp,
          xpData[userID].level,
        ]);
      });

      // Cancella il contenuto esistente
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A1:D`,
      });

      // Scrive i nuovi dati
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A1`,
        valueInputOption: 'RAW',
        resource: { values: rows },
      });

      return true;
    } catch (error) {
      console.error('❌ Errore salvataggio XP:', error.message);
      return false;
    }
  }

  /**
   * Aggiorna solo la riga di un singolo utente (efficiente, non cancella tutto)
   * @param {string} userID - ID Discord dell'utente
   * @param {number} xp - Punti esperienza
   * @param {number} level - Livello
   * @param {string} username - Username Discord
   * @returns {Promise<boolean>} true se l'aggiornamento ha successo
   */
  async updateSingleUser(userID, xp, level, username) {
    await this.initialize();

    try {
      // Carica tutti i dati per trovare la riga dell'utente
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!B2:D`,
      });

      const rows = response.data.values || [];
      let rowIndex = -1;

      // Cerca la riga dell'utente
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][0] === userID) {
          rowIndex = i + 2; // +2 perché iniziamo dalla riga 2
          break;
        }
      }

      if (rowIndex === -1) {
        // Utente non trovato, aggiungi una nuova riga
        const newRowIndex = rows.length + 2;
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A${newRowIndex}:D${newRowIndex}`,
          valueInputOption: 'RAW',
          resource: {
            values: [[username, userID, xp, level]],
          },
        });
      } else {
        // Aggiorna la riga esistente (solo username, XP e level)
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A${rowIndex}:D${rowIndex}`,
          valueInputOption: 'RAW',
          resource: {
            values: [[username, userID, xp, level]],
          },
        });
      }

      return true;
    } catch (error) {
      console.error('❌ Errore aggiornamento utente:', error.message);
      return false;
    }
  }

  /**
   * Ottiene XP e livello di un singolo utente
   * @param {string} userID - ID Discord dell'utente
   * @returns {Promise<Object>} {xp, level}
   */
  async getUserXP(userID) {
    const xpData = await this.loadXPData();
    return xpData[userID] || { xp: 0, level: 0 };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Metodi pubblici generici — usati da moduli esterni (es. reactionRoles.js)
  // Evitano l'accesso diretto a this.sheets dall'esterno
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Legge dati grezzi da un range del foglio
   * @param {string} range - Range Google Sheets (es. "Foglio!A2:E")
   * @returns {Promise<Array<Array<string>>>} Righe di dati
   */
  async getRawData(range) {
    await this.initialize();
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range,
    });
    return response.data.values || [];
  }

  /**
   * Scrive dati grezzi in un range del foglio (clear + update)
   * @param {string} clearRange - Range da cancellare (es. "Foglio!A1:E")
   * @param {string} writeRange - Range dove scrivere (es. "Foglio!A1")
   * @param {Array<Array<string>>} rows - Righe di dati da scrivere
   */
  async setRawData(clearRange, writeRange, rows) {
    await this.initialize();
    await this.sheets.spreadsheets.values.clear({
      spreadsheetId: this.spreadsheetId,
      range: clearRange,
    });
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: writeRange,
      valueInputOption: 'RAW',
      resource: { values: rows },
    });
  }
}

module.exports = GoogleSheetsDB;
