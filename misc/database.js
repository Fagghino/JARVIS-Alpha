/**
 * Modulo di connessione al Database MongoDB (Mongoose)
 *
 * Gestisce la connessione cloud asincrona per garantire la persistenza dei dati
 * anche su hosting con filesystem volatile come Render Free Tier.
 */

const mongoose = require('mongoose');

let isConnected = false;

/**
 * Connette il bot al cluster MongoDB Atlas
 * @returns {Promise<boolean>} Status della connessione
 */
async function connectDB() {
  if (isConnected) return true;

  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.warn('⚠️  [DB Warning] MONGODB_URI non è definita nel file config/.env.');
    console.warn('   Il bot utilizzerà la modalità di compatibilità locale/fallback.');
    return false;
  }

  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('✅ Connesso con successo a MongoDB Atlas Cloud!');
    return true;
  } catch (error) {
    console.error('❌ Errore di connessione a MongoDB:', error.message);
    return false;
  }
}

/**
 * Restituisce lo stato della connessione DB
 */
function isDBConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

module.exports = {
  connectDB,
  isDBConnected,
};
