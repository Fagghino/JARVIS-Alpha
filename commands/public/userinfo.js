/**
 * Comando /userinfo - Informazioni utente
 *
 * Mostra informazioni dettagliate su un utente del server:
 * data di creazione account, ingresso nel server, ruoli.
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Mostra informazioni sull\'utente')
    .addUserOption(option =>
      option
        .setName('utente')
        .setDescription('Seleziona un utente (opzionale)')
    ),

  async execute(interaction) {
    // Ottieni l'utente selezionato o chi ha eseguito il comando
    const member = interaction.options.getMember('utente') || interaction.member;
    const user = member.user;

    // Formatta i ruoli dell'utente come menzioni
    const roles = member.roles.cache
      .filter(role => role.name !== '@everyone')
      .map(role => `<@&${role.id}>`)
      .join(', ') || 'Nessun ruolo';

    // Timestamp formattati per Discord
    const accountCreatedTimestamp = `<t:${Math.floor(user.createdAt.getTime() / 1000)}:R>`;
    const serverJoinedTimestamp = `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>`;

    // Crea l'embed con le informazioni dell'utente
    const userInfoEmbed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(`Informazioni su ${user.username}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .addFields(
        { name: ':calendar: Da quanto tempo ha creato l\'account:', value: accountCreatedTimestamp, inline: true },
        { name: ':calendar: Da quanto tempo è nel server:', value: serverJoinedTimestamp, inline: true },
        { name: ':id: ID Utente:', value: user.id, inline: true },
        { name: ':people_hugging: Ruoli:', value: roles, inline: false }
      )
      .setFooter({
        text: `Richiesto da ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });

    await interaction.reply({ embeds: [userInfoEmbed] });
  },
};
