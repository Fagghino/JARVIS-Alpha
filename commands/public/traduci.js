/**
 * Comando /traduci - Traduzione automatica
 *
 * Traduce automaticamente l'ultimo messaggio non-bot del canale in italiano.
 * Utilizza Google Translate API.
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { translateText } = require('../../utils/translator');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('traduci')
    .setDescription('Traduce l\'ultimo messaggio in italiano')
    .setDMPermission(false),

  async execute(interaction) {
    try {
      // Recupera gli ultimi 10 messaggi e trova l'ultimo non-bot
      const messages = await interaction.channel.messages.fetch({ limit: 10 });
      const lastMessage = messages.find(msg => !msg.author.bot);

      if (!lastMessage) {
        return await interaction.reply({ content: 'Non ho trovato messaggi recenti da tradurre.', ephemeral: true });
      }

      const text = lastMessage.content;

      // Traduce il testo in italiano usando il nostro modulo di traduzione
      const translatedText = await translateText(text, 'it');

      // Crea l'embed con la traduzione
      const embed = new EmbedBuilder()
        .setTitle('Traduzione:')
        .setDescription(translatedText)
        .setColor(0x3498db);

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Errore nella traduzione:', error);
      await interaction.reply({ content: 'Si è verificato un errore nella traduzione.', ephemeral: true });
    }
  }
};
