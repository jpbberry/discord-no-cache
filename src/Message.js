const Channel = require("./Channel");

module.exports = class Message {
  #shard;
  constructor(obj, shard) {
    this.#shard = shard;

    // IDs
    this.id = obj.id;
    this.guildID = obj.guild_id;

    // IDK
    this.channel = new Channel(obj.channel_id, shard);

    // People
    this.author = obj.author;
    this.member = obj.member;

    // Content
    this.content = obj.content;
    this.embeds = obj.embeds;
    this.attachments = obj.attachments;

    // Other stuff
    this.timestamp = new Date(obj.timestamp);
    this.refrencedMessage = obj.refrenced_message;
    this.link = `https://discord.com/channels/${this.guildID}/${obj.channel_id}/${this.id}`;
  }

  edit(message) {
    return this.#shard.client.edit(this.channel.id, this.id, message)
  }
}
