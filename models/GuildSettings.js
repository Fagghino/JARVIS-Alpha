const mongoose = require('mongoose');

const guildSettingsSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true, index: true },
  welcomeChannelId: { type: String, default: '' },
  goodbyeChannelId: { type: String, default: '' },
  levelUpChannelId: { type: String, default: '' },
  totalChannelId: { type: String, default: '' },
  usersChannelId: { type: String, default: '' },
  botsChannelId: { type: String, default: '' },
  newMemberRoleId: { type: String, default: '' },
  botRoleId: { type: String, default: '' },
  inviteLink: { type: String, default: '' },
  features: {
    xpEnabled: { type: Boolean, default: true },
    welcomeEnabled: { type: Boolean, default: true },
    counterEnabled: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('GuildSettings', guildSettingsSchema);
