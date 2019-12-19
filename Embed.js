class Embed {
    constructor () {
        this.obj = {
            title: null,
            description: null,
            url: null,
            timestamp: null,
            color: 0,
            fields: [],

            thumbnail: null,
            footer: null,
            image: null,
            author: null
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
    
    thumbnail(url, width, height) {
        this.obj.thumbnail = {
            url: url,
            width: width || null,
            height: height || null
        }
        return this
    }
    
    footer(text, icon) {
        this.obj.footer = {
            text: text || null,
            icon_url: icon || null
        }
        return this
    }
    
    image(url, height, width) {
        this.obj.image = {
            url: url,
            width: width || null,
            height: height || null
        }
        return this
    }
    
    author(name, icon, url) {
        this.obj.author = {
            name: name,
            icon_url: icon,
            url: url
        }
        return this
    }
    
    render() {
        return this.obj
    }
}

module.exports = Embed
