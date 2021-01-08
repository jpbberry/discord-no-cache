let browser = typeof window !== 'undefined';
const WS = browser ? WebSocket : require('ws');

const Message = require('./Message');

const separate = require('../utils/seperate.js');

let wsAdapt = {
  message: (ws, fn) => { return browser ? ws.onmessage = fn : ws.on('message', fn); },
  open: (ws, fn) => { return browser ? ws.onopen = fn : ws.on('open', fn); },
  close: (ws, fn) => { return browser ? ws.onclose = fn : ws.on('close', fn); }
};

class Shard {
  constructor(shardID, client) {
    this.id = shardID;
    this.client = client;
    this.ws = null;

    this.ping = null;
    this.logMSG = this.format(this.id, this.client.options.shards);

    this.hbInterval = null;
    this.s = null;

    this.waitingHeartbeat = false;
  }

  spawn() {
    let ws;
    this.ws = ws = new WS(this.client.options.websocket);

    this.client.debug(this.logMSG + ` Spawned shard`);

    wsAdapt.message(ws, (msg) => {
      this.message(msg);
    });
    wsAdapt.open(ws, (msg) => {
      this.open(msg);
    });
    wsAdapt.close(ws, (msg) => {
      this.close(msg);
    });
  }

  heartbeat() {
    if (this.waitingHeartbeat) { this.client.debug(this.logMSG + ` Heartbeat took too long`); };
    this.ws.send(
      JSON.stringify({
        op: 1,
        d: this.s
      })
    );
    this.waitingHeartbeat = new Date().getTime();
    this.client.debug(this.logMSG + ` Sending Heartbeat`);
  }

  message(msg) {
    var data = JSON.parse(browser ? msg.data : msg);
    if (data.s) this.s = data.s;

    if (this.client.options.ignoreEvents.includes(data.t)) return;

    this.client.emit('raw', data.d || data, this);

    switch (data.op) {
      case 0:
        this.client.debug(this.logMSG + ` Recieved Event ${data.t}`);
        switch (data.t) {
          case 'MESSAGE_UPDATE':
          case 'MESSAGE_CREATE':
            if (!data.d.content) return;
            this.client.emit('message', new Message(data.d, this), this);
            break;
          case 'GUILD_CREATE':
            this.client.cache.guilds[data.d.id] = data.d;
            this.client.emit('guildCreate', data.d, this);
            break;
          case 'GUILD_UPDATE':
            const oldGuild = this.client.cache.guilds[data.d.id];
            this.client.cache.guilds[data.d.id] = data.d;
            this.client.emit('guildUpdate', data.d, oldGuild, this);
            break;
          case 'READY':
            this.user = data.d?.user;
            while (!this.user.bot) { }
            break;
          default:
            this.client.emit(data.t, data.d || data, this);
            break;
        }
        break;
      case 10:
        this.hello(data);
        break;
      case 11:
        this.ack(data);
        break;
      default:
        this.client.emit(data.t, data.d || data, this);
        break;
    }
  }

  hello(msg) {
    this.client.debug(this.logMSG + ` Starting`);
    this.ws.send(
      JSON.stringify({
        op: 2,
        d: {
          shard: this.client.options.shards > 1 ? [this.id, this.client.options.shards] : undefined,
          token: this.client.token,
          properties: {
            "$os": require('os').platform(),
            "$browser": this.client.options.browser,
            "$device": "idkwebsockets"
          }
        }
      })
    );

    this.hbInterval = setInterval(this.heartbeat.bind(this), msg.d.heartbeat_interval);
    this.heartbeat();
    this.client.debug(this.logMSG + ` Heartbeat interval: ${msg.d.heartbeat_interval}`);
  }

  format(num, shards) {
    const str = `Shard ${num}`;
    const len = ` Shard ${shards - 1} `.length;
    return `${separate(str, len)}|`.cyan.bold;
  }

  ack(msg) {
    let cur = new Date().getTime() - this.waitingHeartbeat;
    this.client.debug(this.logMSG + ` Heartbeat acknowledged after ${cur}ms`);
    this.ping = cur;
    this.waitingHeartbeat = false;
  }

  open() {
    this.client.debug(this.logMSG + ` WebSocket started`);
  }

  close(msg = { reason: undefined, code: undefined }) {
    this.client.debug(this.logMSG + ` Closed. Reason: ${msg.reason}. Code: ${msg.code}`);
    clearInterval(this.hbInterval);
    if (!msg.reason && !msg.code) return this.spawn();
    if (this.id === 0) return process.exit();
  }

  kill() {
    this.client.debug(this.logMSG + ` Killed.`);
    this.ws.close();
  }
}

module.exports = Shard;
