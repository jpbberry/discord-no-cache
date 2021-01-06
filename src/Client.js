const Embed = require('./Embed.js');

const RestManager = require('discord-rest');
const req = require("node-fetch");
const EventHandler = require('events');

function wait(a) { return new Promise(r => { setTimeout(() => r(), a); }); }

const Shard = require("./Shard.js");

class Client extends EventHandler {
  constructor(token, options = {}, debug = () => { }) {
    super();
    this.debug = debug;
    this.options = {
      shards: options.shards || 1,
      ignoreEvents: options.ignoreEvents || [],
      websocket: options.websocket || "wss://gateway.discord.gg/?v=6&encoding=json",
      api: "https://discordapp.com/api/v8",
      dontStart: options.dontStart || false,
      spawnTimeout: options.spawnTimeout || 6000
    };
    this.cache = {
      guilds: {}
    };
    this.token = token;
    this.shards = [];
    this.rest = new RestManager(token);

    if (!this.options.dontStart) this.start();

    this.Embed = Embed;
  }

  get api() {
    return this.rest.builder();
  }

  get embed() {
    return new this.Embed();
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
    this.shards.forEach(_ => { _.kill(); });
  }

  // request(endpoint, method = "GET", body = null, headers = {}) {
  //   return new Promise((res, rej) => {
  //     if (!["GET", "POST", "PATCH", "DELETE", "PUT"].includes(method)) throw new TypeError("Method must be GET, POST, PATCH, DELETE or PUT");
  //     const go = () => {
  //       req(encodeURI(this.options.api + endpoint), {
  //         method: method,
  //         body: body ? JSON.stringify(body) : null,
  //         headers: {
  //           Authorization: `Bot ${this.token}`,
  //           "Content-Type": "application/json",
  //           ...headers
  //         }
  //       })
  //         .then(x => {
  //           if (x.status !== 204) return x.json();
  //         })
  //         .then(response => {
  //           if (response && response.retry_after) return setTimeout(() => {
  //             go();
  //           }, response.retry_after);
  //           res(response);
  //         })
  //         .catch(err => rej(err));
  //     };
  //     go();
  //   });
  // }

  // async react(channelID, messageID, reaction) {
  //   return await this.request(`/channels/${channelID}/messages/${messageID}/reactions/${reaction.match(/^[0-9]*$/) ? `e:${reaction}` : reaction}/@me`, 'PUT');
  // }

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
      );
    }
  }

  messageMenu(channelID, filter = () => true, timeout = () => { }, time, amount = 1, onm = () => { }) {
    return new Promise((resolve) => {
      let res = [];
      let through = 0;
      let tm;
      const collector = (message) => {
        if (message.channel_id === channelID && filter(message)) {
          through++;
          onm(message);
          if (res > 1) res.push(message);
          else res = message;

          if (through >= amount) {
            if (tm) clearTimeout(tm);
            this.off('MESSAGE_CREATE', collector);
            resolve(res);
          }
        }
      };
      this.on('MESSAGE_CREATE', collector);
      if (time) tm = setTimeout(() => {
        this.off('MESSAGE_CREATE', collector);
        resolve(null);
        timeout();
      }, time);
    });
  }

  async reactMenu(channelID, messageID, reacts = {}, filter = () => true, timeout = () => { }, time) {
    let stopped = false;
    let tm;
    const collector = (reaction) => {
      if (reaction.channel_id !== channelID || reaction.message_id !== messageID || !filter(reaction)) return;
      const fn = reacts[reaction.emoji.id || reaction.emoji.name];
      if (!fn) return;
      stopped = true;
      if (tm) clearTimeout(tm);
      fn();
      this.off('MESSAGE_REACTION_ADD', collector);
    };
    this.on('MESSAGE_REACTION_ADD', collector);
    if (time) tm = setTimeout(() => {
      stopped = true;
      timeout();
      this.off('MESSAGE_REACTION_ADD', collector);
    }, time);
    const keys = Object.keys(reacts);
    for (let i = 0; i < keys.length; i++) {
      if (stopped) break;
      console.log(await this.react(channelID, messageID, keys[i]));
    }
  }
}

module.exports = Client;
