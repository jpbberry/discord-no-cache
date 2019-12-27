const WS = require("ws");
const Embed = require('./Embed.js')
const req = require("node-fetch");
const EventHandler = require('events')

function wait(a) { return new Promise(r => { setTimeout(() => r(), a) }) }

const Shard = require("./Shard.js");

class Client extends EventHandler {
  constructor(token, options = {}, debug = () => {}) {
    super()
    this.debug = debug;
    this.options = {
      shards: options.shards || 1,
      ignoreEvents: options.ignoreEvents || [],
      websocket: options.websocket || "wss://gateway.discord.gg/?v=6&encoding=json",
      api: "https://discordapp.com/api/v7",
      dontStart: options.dontStart || false,
      spawnTimeout: options.spawnTimeout || 6000
    };
    this.token = token;
    this.shards = [];

    if (!this.options.dontStart) this.start();

    this.Embed = Embed
  }

  get embed() {
    return new this.Embed()
  }

  async start() {
    for (var shard = 0; shard < this.options.shards; shard++) {
      this.spawn(shard);
      await wait(this.options.spawnTimeout);
    }
  }

  spawn(shard) {
    let s = new Shard(shard, this);
    this.shards.push(s);
    this.debug(`Starting shard ${shard}`);
    s.spawn();
  }

  kill() {
    this.shards.forEach(_ => { _.kill() })
  }

  request(endpoint, method = "GET", body = null, headers = {}) {
    return new Promise((res, rej) => {
      if (!["GET", "POST", "PATCH", "DELETE", "PUT"].includes(method)) throw new TypeError("Method must be GET, POST, PATCH, DELETE or PUT");
      req(this.options.api + endpoint, {
          method: method,
          body: body ? JSON.stringify(body) : null,
          headers: {
            Authorization: `Bot ${this.token}`,
            "Content-Type": "application/json",
            ...headers
          }
        })
        .then(x => {
          if (x.status !== 204) return x.json()
        })
        .then(response => { res(response) })
        .catch(err => rej(err));
    })
  }
  async send(channelID, contentOrOBJ = {}, obj = {}) {
    if (typeof contentOrOBJ !== 'string') {
      if (contentOrOBJ instanceof Embed) contentOrOBJ = { embed: contentOrOBJ.render() }
      obj = {
        ...obj,
        ...contentOrOBJ
      }
    }
    else {
      obj["content"] = contentOrOBJ;
    }
    return await this.request(`/channels/${channelID}/messages`, "POST", obj);
  }
  async edit(channelID, messageID, contentOrOBJ, obj = {}) {
    if (typeof contentOrOBJ !== 'string') {
      if (contentOrOBJ instanceof Embed) contentOrOBJ = { embed: contentOrOBJ.render() }
      obj = {
        ...obj,
        ...contentOrOBJ
      }
    }
    else {
      obj["content"] = contentOrOBJ;
    }
    return await this.request(`/channels/${channelID}/messages/${messageID}`, "PATCH", obj);
  }
  async deleteMessage(channelID, messageID) {
    return await this.request(`/channels/${channelID}/messages/${messageID}`, "DELETE");
  }

  setStatus(data) {
    for (let shard of this.shards) {
      shard.ws.send(
        JSON.stringify({
          op: 3,
          d: {
            afk: data.afk || false,
            since: data.since || 0,
            status: data.status || 'online',
            game: data.game || null
          }
        })
      )
    }
  }

  messageMenu(channelID, filter = () => true, amount = 1, onm = () => {}) {
    return new Promise((resolve) => {
      let res = []
      let through = 0
      const collector = (message) => {
        if (message.channel_id === channelID && filter(message)) {
          through++
          onm(message)
          if (res > 1) res.push(message)
          else res = message
          
          if (through >= amount) {
            this.off('MESSAGE_CREATE', collector)
            resolve(res)
          }
        }
      }
      this.on('MESSAGE_CREATE', collector)
    })
  }
}

module.exports = Client;
