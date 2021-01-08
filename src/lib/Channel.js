const Embed = require('./Embed');

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
    const req = await this.#shard.client.api().channels[this.id].messages.post({
      body: {
        ...obj,
      }
    });
    if (req.code) throw new Error(req.message)
    return new (require('./Message'))(req, this.#shard);
  }

  async fetch() {
    return await this.#shard.client.api().channels[this.id].get();
  }

  async delete() {
    const req = await this.#shard.client.api().channels[this.id].delete();
    if (req.code) throw new Error(req.message)
    return req
  }

  async fetchMessages(num) {
    const req = await this.#shard.client.api().channels[this.id][`messages?limit=${parseInt(num)}`].get()
    if (req.code) throw new Error(req.message);
    return req;
  }

  async bulkDelete(num) {
    const messages = (await this.fetchMessages(num)).filter(msg => new Date(msg.timestamp).getTime() + 1000 * 60 * 60 * 24 * 14 > new Date().getTime()).map(msg => msg.id);
    const req = await this.#shard.client.api().channels[this.id].messages['bulk-delete'].post({
      body: { messages: messages }
    })
    if (req.code) throw new Error(req.message);
    return messages;
  }
};
