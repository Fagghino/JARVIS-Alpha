const mongoose = require('mongoose');

const reactionRoleSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  channelId: { type: String, required: true },
  messageId: { type: String, required: true },
  title: { type: String, default: '' },
  rolesMap: { type: Object, default: {} } // { emojiKey: roleId }
}, { timestamps: true });

reactionRoleSchema.index({ channelId: 1, messageId: 1 }, { unique: true });

module.exports = mongoose.model('ReactionRole', reactionRoleSchema);
