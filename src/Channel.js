const Message = require("./Message");

module.exports = class Channel {
  #shard;
  constructor(id, shard) {
    this.#shard = shard;

    // IDs
    this.id = id;
  }

  async send(message) {
    const req = await this.#shard.client.send(this.id, message)
    if(req.code) {
      throw new Error('DiscordAPIError: ' + req.message);
    } else return new (require('./Message'))(req, this.#shard);
  }
}
