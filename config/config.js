/**
 * Configurazione centralizzata globale del bot JARVIS (Multi-Server)
 *
 * Le configurazioni specifiche di ciascun server Discord (canali, ruoli, contatori, link di invito)
 * sono salvate in modo indipendente sul database MongoDB Cloud ed impostabili dagli amministratori tramite
 * la Web Dashboard o il comando /set senza mai accedere direttamente al database.
 */

module.exports = {
  // Impostazioni predefinite per nuovi server (vuote finché l'admin non le configura tramite /set o Dashboard)
  serverId: '',
  inviteLink: '',
  usersChannelId: '',
  botsChannelId: '',
  totalChannelId: '',
  welcomeChannelId: '',
  goodbyeChannelId: '',
  levelUpChannelId: '',
  newMemberRoleId: '',
  botRoleId: ''
};
