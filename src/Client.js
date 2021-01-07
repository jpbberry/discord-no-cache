const Embed = require('./Embed.js');

const RestManager = require('discord-rest');
const EventHandler = require('events');
const colors = require('colors');

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

    this.logMSG = this.format(this.options.shards);
    // this.logMSG = '[ Client  ]'.magenta.bold;

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

  format(shards) {
    const str = 'Client';
    const len = ` Shard ${shards - 1} `.length;
    return `${this.separate(str, len)}|`.magenta.bold;
  }

  separate(str, to) {
    let res = str;
    let sw = 1;
    for (let i = 0; i < 100; i++) {
      if (sw === 1) res = res + ' ';
      else res = ' ' + res;
      if (res.length >= to) break;
      sw = sw * -1;
    }
    return res;
  }

  spawn(shard) {
    let s = new Shard(shard, this);
    this.shards.push(s);
    this.debug(this.logMSG + ` Starting shard ${shard}`);
    s.spawn();
  }

  kill() {
    this.shards.forEach(_ => { _.kill(); });
  }

  setStatus(data) {
    this.debug(this.logMSG + `Setting status`);
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
}

module.exports = Client;
