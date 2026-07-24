/**
 * Comando /invita - Link invito server (solo admin)
 *
 * Mostra il link di invito del server configurato in config.js.
 */

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { inviteLink } = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invita')
    .setDescription('Ottieni il link di invito per il server (SOLO ADMIN)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // Crea l'embed con il link di invito
    const inviteEmbed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('Invito al server :partying_face:')
      .setDescription('Vuoi invitare i tuoi amici? Usa il link qui sotto per farli entrare!')
      .addFields(
        { name: ':link: Link di invito:',
            value: `[Clicca qui per unirti!](${inviteLink})\n${inviteLink}`
        }
      )
      .setFooter({ text: 'Non vediamo l\'ora di vederti nel server!', iconURL: interaction.guild.iconURL() });

    await interaction.reply({ embeds: [inviteEmbed] });
  },
};
