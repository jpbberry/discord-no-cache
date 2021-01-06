const Embed = require("./Embed");
const Message = require("./Message");

module.exports = class Channel {
  #shard;
  constructor(id, shard) {
    this.#shard = shard;

    this.id = id;
  }

  async send(message = {}) {
    let obj = {};
    if (typeof message !== 'string') {
      if (message instanceof Embed) message = { embed: message.render() };
      obj = { ...obj, ...message };
    } else obj["content"] = message;
    return new (require('./Message'))(await this.#shard.client.api().channels[this.id].messages.post({ body: obj }), this.#shard)
  }
}
