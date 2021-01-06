const Embed = require("./Embed");
const Message = require("./Message");

module.exports = class Channel {
  #shard;
  constructor(id, shard) {
    this.#shard = shard;

    this.id = id;
  }

  async send(message) {
    let obj = {};
    if (typeof message === 'string') {
      obj['content'] = message;
    } else {
      if (message instanceof Embed) {
        obj['embed'] = message.render();
      } else obj = message;
    };
    return new Message(await this.#shard.client.api().channels[this.id].messages.post({
      body: {
        ...obj,
      }
    }), this.#shard);
  }
};
