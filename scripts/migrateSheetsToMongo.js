/**
 * Script di Migrazione da Google Sheets a MongoDB Cloud
 *
 * Legge tutti i dati degli utenti (XP/Livelli) e dei Reaction Roles da Google Sheets
 * e li importa nelle collezioni di MongoDB Atlas.
 *
 * Esecuzione:
 *   node scripts/migrateSheetsToMongo.js
 *   oppure: npm run migrate
 */

require('dotenv').config({ path: './config/.env' });
const mongoose = require('mongoose');
const config = require('../config/config.js');
const GoogleSheetsDB = require('../misc/googleSheetsDB.js');

const UserXP = require('../models/UserXP.js');
const ReactionRole = require('../models/ReactionRole.js');
const GuildSettings = require('../models/GuildSettings.js');

async function migrate() {
  console.log('🚀 Avvio migrazione dati da Google Sheets a MongoDB...');

  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error('❌ ERRORE: MONGODB_URI non trovata nel file config/.env.');
    process.exit(1);
  }

  // 1. Connessione a MongoDB
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connesso a MongoDB Atlas Cloud.');
  } catch (err) {
    console.error('❌ Errore di connessione a MongoDB:', err.message);
    process.exit(1);
  }

  // 2. Inizializzazione Google Sheets DB
  const sheetsXP = new GoogleSheetsDB(process.env.SPREADSHEET_ID, config.sheetUserLevel);
  const sheetsRR = new GoogleSheetsDB(process.env.SPREADSHEET_ID, config.sheetReactionRoles);

  let migratedUsers = 0;
  let migratedRR = 0;

  // 3. Migrazione Utenti (XP e Livelli)
  try {
    console.log(`🔄 Lettura foglio XP ("${config.sheetUserLevel}")...`);
    await sheetsXP.initialize();
    const rowsXP = await sheetsXP.getRawData(`${sheetsXP.sheetName}!A2:D`);

    const primaryGuildId = config.serverId || 'default';
    const xpOps = [];

    rowsXP.forEach(row => {
      // row: [username, userID, xp, level]
      if (row[1]) { // userID
        const username = row[0] || 'Unknown';
        const userId = row[1];
        const xp = parseInt(row[2]) || 0;
        const level = parseInt(row[3]) || 0;

        xpOps.push({
          updateOne: {
            filter: { guildId: primaryGuildId, userId },
            update: {
              $set: { username, xp, level }
            },
            upsert: true
          }
        });
      }
    });

    if (xpOps.length > 0) {
      const result = await UserXP.bulkWrite(xpOps);
      migratedUsers = (result.upsertedCount || 0) + (result.modifiedCount || 0);
      console.log(`✅ ${migratedUsers} utenti migrati/aggiornati su MongoDB per il server [${primaryGuildId}]!`);
    } else {
      console.log('ℹ️ Nessun utente trovato nel foglio Google Sheets.');
    }
  } catch (err) {
    console.error('❌ Errore migrazione XP:', err.message);
  }

  // 4. Migrazione Reaction Roles
  try {
    console.log(`🔄 Lettura foglio Reaction Roles ("${config.sheetReactionRoles}")...`);
    await sheetsRR.initialize();
    const rowsRR = await sheetsRR.getRawData(`${sheetsRR.sheetName}!A2:E`);

    const rrOps = [];

    rowsRR.forEach(row => {
      // row: [guildId, channelId, messageId, title, rolesJson]
      if (row[0] && row[1] && row[2]) {
        const guildId = row[0];
        const channelId = row[1];
        const messageId = row[2];
        const title = row[3] || '';
        let rolesMap = {};
        try {
          rolesMap = row[4] ? JSON.parse(row[4]) : {};
        } catch (e) {}

        rrOps.push({
          updateOne: {
            filter: { channelId, messageId },
            update: {
              $set: { guildId, channelId, messageId, title, rolesMap }
            },
            upsert: true
          }
        });
      }
    });

    if (rrOps.length > 0) {
      const resultRR = await ReactionRole.bulkWrite(rrOps);
      migratedRR = (resultRR.upsertedCount || 0) + (resultRR.modifiedCount || 0);
      console.log(`✅ ${migratedRR} configurazioni Reaction Roles migrate su MongoDB!`);
    } else {
      console.log('ℹ️ Nessun Reaction Role trovato nel foglio Google Sheets.');
    }
  } catch (err) {
    console.error('❌ Errore migrazione Reaction Roles:', err.message);
  }

  // 5. Inizializzazione Configurazione Server Primario (GuildSettings)
  try {
    if (config.serverId) {
      await GuildSettings.findOneAndUpdate(
        { guildId: config.serverId },
        {
          $set: {
            guildId: config.serverId,
            welcomeChannelId: config.welcomeChannelId || '',
            goodbyeChannelId: config.goodbyeChannelId || '',
            levelUpChannelId: config.levelUpChannelId || '',
            totalChannelId: config.totalChannelId || '',
            usersChannelId: config.usersChannelId || '',
            botsChannelId: config.botsChannelId || '',
            newMemberRoleId: config.newMemberRoleId || '',
            botRoleId: config.botRoleId || '',
            inviteLink: config.inviteLink || '',
            features: { xpEnabled: true, welcomeEnabled: true, counterEnabled: true }
          }
        },
        { upsert: true, new: true }
      );
      console.log(`✅ Configurazione iniziale migrata per il server primario [${config.serverId}]!`);
    }
  } catch (err) {
    console.error('❌ Errore salvataggio GuildSettings iniziale:', err.message);
  }

  console.log('\n🎉 MIGRAZIONE COMPLETATA CON SUCCESSO!');
  console.log(`📊 Riepilogo:`);
  console.log(`• Utenti XP importati: ${migratedUsers}`);
  console.log(`• Reaction Roles importati: ${migratedRR}`);

  await mongoose.disconnect();
  process.exit(0);
}

migrate();
