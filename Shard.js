let browser = typeof window !== 'undefined'
const WS = browser ? WebSocket : require("ws");
const req = browser ? fetch : require("node-fetch");
function wait(a) { return new Promise(r => { setTimeout(() => r(), a) }) }

let wsAdapt = {
    message: (ws, fn) => { return browser ? ws.onmessage = fn : ws.on("message", fn); },
    open: (ws, fn) => { return browser ? ws.onopen = fn : ws.on("open", fn); },
    close: (ws, fn) => { return browser ? ws.onclose = fn : ws.on("close", fn); }
}
class Shard {
    constructor(shardID, client) {
        this.id = shardID;
        this.client = client;
        this.ws = null;

        this.hbInterval = null;
        this.s = null;

        this.waitingHeartbeat = false;
    }

    spawn() {
        let ws;
        this.ws = ws = new WS(this.client.options.websocket);

        this.client.debug(`Spawned shard ${this.id}`)

        wsAdapt.message(ws, (msg) => {
            this.message(msg);
        })
        wsAdapt.open(ws, (msg) => {
            this.open(msg);
        })
        wsAdapt.close(ws, (msg) => {
            this.close(msg);
        })
    }

    heartbeat() {
        if (this.waitingHeartbeat) { this.client.debug(`Shard ${this.id} heartbeat took too long`) };
        this.ws.send(
            JSON.stringify({
                op: 1,
                d: this.s
            })
        );
        this.waitingHeartbeat = new Date().getTime();
        this.client.debug("Heartbeat")
    }

    message(msg) {
        var data = JSON.parse(browser ? msg.data : msg);
        if (data.s) this.s = data.s;

        if (this.client.options.ignoreEvents.includes(data.t)) return;

        this.client.emit(data.t, data.d || data, this);
        this.client.emit("*", data.d || data, this);

        if (data.op == 10) this.hello(data);
        if (data.op == 11) this.ack(data);
    }

    hello(msg) {
        this.client.debug(`Hello on shard ${this.id}`)
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

        this.hbInterval = setInterval(this.heartbeat.bind(this), msg.d.heartbeat_interval);
        this.client.debug("Heartbeat interval: " + msg.d.heartbeat_interval)
    }

    ack(msg) {
        let cur = new Date().getTime() - this.waitingHeartbeat;
        this.client.debug(`Heartbeat on shard ${this.id} acknowledged after ${cur}ms`);
        this.waitingHeartbeat = false;
    }

    open() {
        this.client.debug(`${this.id} websocket started`);
    }
    close(msg) {
        console.debug(`Shard ${this.id} closed, Reason: ${msg.reason} Code: ${msg.code}`);
        clearInterval(this.hbInterval);
    }
    
    kill() {
        this.ws.close();
    }
}

module.exports = Shard;