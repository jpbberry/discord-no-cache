class Embed {
    constructor () {
        this.obj = {
            title: null,
            description: null,
            url: null,
            timestamp: null,
            color: 0,
            fields: []
        }
    }
    
    description(desc) {
        this.obj.description = desc
        return this
    }
    
    title(title) {
        this.obj.title = title
        return this
    }
    
    timestamp(date = new Date()) {
        this.obj.timestamp = date.toISOString()
        return this
    }
    
    color(color) {
        this.obj.color = color
        return this
    }
    
    field(name, value, inline) {
        this.obj.fields.push({
            name: name,
            value: value,
            inline: inline
        })
        return this
    }
    
    render() {
        return this.obj
    }
}

module.exports = Embed
