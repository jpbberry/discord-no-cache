const Channel = require("./Channel");
const Embed = require("./Embed");

module.exports = class Message {
  shard;
  constructor(obj, shard) {
    this.shard = shard;

    // IDs
    this.id = obj.id;
    this.guildID = obj.guild_id || obj.message_reference?.guild_id || undefined;

    // IDK
    this.channel = new Channel(obj.channel_id, shard);

    // People
    this.author = {
      id: obj.author.id,
      username: obj.author.username,
      flags: obj.author.public_flags,
      discriminator: obj.author.discriminator,
      avatarURL: `https://cdn.discordapp.com/avatars/${obj.author.id}/${obj.author.avatar}`
    };
    this.member = obj.member;

    // Content
    this.content = obj.content;
    this.embeds = obj.embeds;
    this.attachments = obj.attachments;

    // Other stuff
    this.timestamp = new Date(obj.timestamp);
    this.messageReference = obj.message_reference;
    this.refrencedMessage = obj.referenced_message;
    this.link = `https://discord.com/channels/${this.guildID}/${obj.channel_id}/${this.id}`;
  }

  async edit(message) {
    let obj = {};
    if (typeof message !== 'string') {
      if (message instanceof Embed) message = { embed: message.render() };
      obj = { ...obj, ...message };
    } else obj["content"] = message;
    return new Message(await this.shard.client.api().channels[this.channel.id].messages[this.id].patch({ body: { content: obj } }), this.shard);
  }

  async reply(message) {
    let obj = {};
    if (typeof message === 'string') {
      obj['content'] = message;
    } else {
      if (message instanceof Embed) {
        obj['embed'] = message.render();
      } else obj = message;
    };
    return new Message(await this.shard.client.api().channels[this.channel.id].messages.post({
      body: {
        ...obj,
        message_reference: {
          message_id: this.id,
          guild_id: this.guildID,
          channel_id: this.channel.id
        }
      }
    }), this.shard);
  }

  delete() {
    return this.shard.client.api().channels[this.channel.id].messages[this.id].delete();
  }
};
