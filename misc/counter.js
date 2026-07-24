/**
 * Sistema contatore membri del server (Multi-Server)
 *
 * Aggiorna automaticamente i nomi dei canali vocali con il conteggio di:
 * - Membri totali
 * - Utenti (non bot)
 * - Bot
 *
 * Include una gestione sequenziale dei server con ritardo (2s) per evitare rate-limit su Discord API.
 */

const { getGuildConfig } = require('../utils/guildSettings');

/**
 * Inizializza e avvia il sistema di conteggio membri
 * @param {Object} client - Client Discord
 */
module.exports = (client) => {
    /**
     * Aggiorna i nomi dei canali per una singola gilda
     */
    const updateGuildCounter = async (guild, guildConfig) => {
        try {
            if (!guildConfig.totalChannelId && !guildConfig.usersChannelId && !guildConfig.botsChannelId) {
                return;
            }

            let fetchedMembers;
            try {
                fetchedMembers = await guild.members.fetch({ time: 10000 });
            } catch (fetchError) {
                fetchedMembers = guild.members.cache;
            }

            const totalMembers = fetchedMembers.size;
            const users = fetchedMembers.filter(member => !member.user.bot).size;
            const bots = fetchedMembers.filter(member => member.user.bot).size;

            if (guildConfig.totalChannelId) {
                const totalChannel = guild.channels.cache.get(guildConfig.totalChannelId);
                if (totalChannel) await totalChannel.setName(`ᴍᴇᴍʙʀɪ ᴛᴏᴛᴀʟɪ: ${totalMembers.toLocaleString()}`).catch(() => {});
            }

            if (guildConfig.usersChannelId) {
                const usersChannel = guild.channels.cache.get(guildConfig.usersChannelId);
                if (usersChannel) await usersChannel.setName(`ᴜᴛᴇɴᴛɪ: ${users.toLocaleString()}`).catch(() => {});
            }

            if (guildConfig.botsChannelId) {
                const botsChannel = guild.channels.cache.get(guildConfig.botsChannelId);
                if (botsChannel) await botsChannel.setName(`ʙᴏᴛ: ${bots.toLocaleString()}`).catch(() => {});
            }
        } catch (error) {
            console.error(`❌ Errore aggiornamento counter per [${guild.id}]:`, error.message);
        }
    };

    /**
     * Cicla sequenzialmente su tutti i server con ritardo per evitare rate-limit
     */
    const updateAllCounters = async () => {
        if (!client || !client.guilds) return;

        const guilds = Array.from(client.guilds.cache.values());

        for (const guild of guilds) {
            const guildConfig = await getGuildConfig(guild.id);

            if (guildConfig.features && guildConfig.features.counterEnabled === false) {
                continue;
            }

            await updateGuildCounter(guild, guildConfig);

            // Ritardo di 2 secondi tra i server per prevenire HTTP 429 Rate Limit
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    };

    // Primo aggiornamento dopo 5 secondi dal ready
    setTimeout(() => {
        updateAllCounters();
    }, 5000);

    // Ripeti ogni 10 minuti (Discord permette max 2 rinominazioni per canale ogni 10 min)
    setInterval(updateAllCounters, 600000);
};
