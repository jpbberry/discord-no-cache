let browser = typeof window !== 'undefined';
const WS = browser ? WebSocket : require("ws");

const Message = require('./Message');

function wait(a) { return new Promise(r => { setTimeout(() => r(), a); }); }

let wsAdapt = {
  message: (ws, fn) => { return browser ? ws.onmessage = fn : ws.on("message", fn); },
  open: (ws, fn) => { return browser ? ws.onopen = fn : ws.on("open", fn); },
  close: (ws, fn) => { return browser ? ws.onclose = fn : ws.on("close", fn); }
};

class Shard {
  constructor(shardID, client) {
    this.id = shardID;
    this.client = client;
    this.ws = null;

    this.ping = null;

    this.hbInterval = null;
    this.s = null;

    this.waitingHeartbeat = false;
  }

  spawn() {
    let ws;
    this.ws = ws = new WS(this.client.options.websocket);

    this.client.debug(`Spawned shard ${this.id}`);

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
    if (this.waitingHeartbeat) { this.client.debug(`Shard ${this.id} heartbeat took too long`); };
    this.ws.send(
      JSON.stringify({
        op: 1,
        d: this.s
      })
    );
    this.waitingHeartbeat = new Date().getTime();
    this.client.debug("Heartbeat");
  }

  message(msg) {
    var data = JSON.parse(browser ? msg.data : msg);
    if (data.s) this.s = data.s;

    this.client.emit("raw", data.d || data, this);

    if (this.client.options.ignoreEvents.includes(data.t)) return;

    switch (data.op) {
      case 0:
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
    this.client.debug(`Hello on shard ${this.id}`);
    this.ws.send(
      JSON.stringify({
        op: 2,
        d: {
          shard: this.client.options.shards > 1 ? [this.id, this.client.options.shards] : undefined,
          token: this.client.token,
          properties: {
            "$os": "linux",
            "$browser": "jpbbgay",
            "$device": "idkwebsockets"
          }
        }
      })
    );

    this.heartbeat();
    this.hbInterval = setInterval(this.heartbeat.bind(this), msg.d.heartbeat_interval);
    this.client.debug("Heartbeat interval: " + msg.d.heartbeat_interval);
  }

  ack(msg) {
    console.log(msg);
    let cur = new Date().getTime() - this.waitingHeartbeat;
    this.client.debug(`Heartbeat on shard ${this.id} acknowledged after ${cur}ms`);
    console.log(new Date().getTime() - this.waitingHeartbeat)
    this.ping = cur;
    this.waitingHeartbeat = false;
  }

  open() {
    this.client.debug(`${this.id} websocket started`);
  }

  close(msg) {
    console.debug(`Shard ${this.id} closed, Reason: ${msg.reason} Code: ${msg.code}`);
    clearInterval(this.hbInterval);
    process.exit();
  }

  kill() {
    this.ws.close();
  }
}

module.exports = Shard;
