let browser = typeof window !== 'undefined'
const WS = browser ? WebSocket : require("ws");
const req = browser ? fetch : require("node-fetch");
function wait(a) { return new Promise(r => { setTimeout(() => r(), a) }) }

const Shard = require("./Shard.js");

class Client {
    constructor(token, options = {}, debug = () => { }) {
        this.debug = debug;
        this.options = {
            shards: options.shards || 1,
            ignoreEvents: options.ignoreEvents || [],
            websocket: options.websocket || "wss://gateway.discord.gg/?v=6&encoding=json",
            api: "https://discordapp.com/api/v6",
            dontStart: options.dontStart || false,
            spawnTimeout: options.spawnTimeout || 6000
        };
        this.token = token;
        this.shards = [];

        this.events = {};
        this.on = (event, fn) => { if (!this.events[event]) this.events[event] = []; this.events[event].push(fn) };
        this.emit = (event, ...args) => { if (!this.events[event]) return; this.events[event].forEach(_ => { _(...args) }) }

        if (!this.options.dontStart) this.start();
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
        this.shards.forEach(_=>{_.kill()})
    }
    
    request(endpoint, method = "GET", body = null, headers = {}) {
        return new Promise((res, rej) => {
            if(!["GET", "POST", "PATCH", "DELETE", "PUT"].includes(method)) throw new TypeError("Method must be GET, POST, PATCH or DELETE");
            req(this.options.api + endpoint, {
                method: method,
                body: body ? JSON.stringify(body) : null,
                headers: {
                    Authorization: `Bot ${this.token}`,
                    "Content-Type": "application/json",
                    ...headers
                }
            })
            .then(x=>x.json())
            .then(response=>{res(response)})
            .catch(err=>rej(err));
        })
    }
    async send(channelID, contentOrOBJ = {}, obj = {}) {
        if(typeof contentOrOBJ !== 'string') {
            obj = {
                ...obj,
                ...contentOrOBJ
            }
        } else {
            obj["content"] = contentOrOBJ;
        }
        return await this.request(`/channels/${channelID}/messages`, "POST", obj);
    }
    async deleteMessage(channelID, messageID) {
        return await this.request(`/channels/${channelID}/messages/${messageID}`, "DELETE");
    }
}

module.exports = Client;
