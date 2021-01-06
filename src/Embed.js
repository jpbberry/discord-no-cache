// stole from discord.js
const Colors = {
  DEFAULT: 0x000000,
  WHITE: 0xFFFFFF,
  AQUA: 0x1ABC9C,
  GREEN: 0x2ECC71,
  BLUE: 0x3498DB,
  YELLOW: 0xFFFF00,
  PURPLE: 0x9B59B6,
  LUMINOUS_VIVID_PINK: 0xE91E63,
  GOLD: 0xF1C40F,
  ORANGE: 0xE67E22,
  RED: 0xE74C3C,
  GREY: 0x95A5A6,
  NAVY: 0x34495E,
  DARK_AQUA: 0x11806A,
  DARK_GREEN: 0x1F8B4C,
  DARK_BLUE: 0x206694,
  DARK_PURPLE: 0x71368A,
  DARK_VIVID_PINK: 0xAD1457,
  DARK_GOLD: 0xC27C0E,
  DARK_ORANGE: 0xA84300,
  DARK_RED: 0x992D22,
  DARK_GREY: 0x979C9F,
  DARKER_GREY: 0x7F8C8D,
  LIGHT_GREY: 0xBCC0C0,
  DARK_NAVY: 0x2C3E50,
  BLURPLE: 0x7289DA,
  GREYPLE: 0x99AAB5,
  DARK_BUT_NOT_BLACK: 0x2C2F33,
  NOT_QUITE_BLACK: 0x23272A,
};

class Embed {
  constructor() {
    this.obj = {
      title: null,
      description: null,
      url: null,
      timestamp: null,
      color: Colors.DEFAULT,
      fields: [],

      thumbnail: null,
      footer: null,
      image: null,
      author: null
    };
  }

  description(desc) {
    this.obj.description = desc;
    return this;
  }

  title(title, url) {
    this.obj.title = title;
    this.obj.url = url || null;
    return this;
  }

  timestamp(date = new Date()) {
    this.obj.timestamp = date.toISOString();
    return this;
  }

  color(color) {
    if (Colors[color]) color = Colors[color];
    if (color instanceof String) color = Number(color);
    this.obj.color = color;
    return this;
  }

  field(name, value, inline) {
    this.obj.fields.push({
      name: name,
      value: value,
      inline: inline
    });
    return this;
  }

  thumbnail(url, width, height) {
    this.obj.thumbnail = {
      url: url,
      width: width || null,
      height: height || null
    };
    return this;
  }

  footer(text, icon) {
    this.obj.footer = {
      text: text || null,
      icon_url: icon || null
    };
    return this;
  }

  image(url, height, width) {
    this.obj.image = {
      url: url,
      width: width || null,
      height: height || null
    };
    return this;
  }

  author(name, icon, url) {
    this.obj.author = {
      name: name,
      icon_url: icon,
      url: url
    };
    return this;
  }

  render() {
    return this.obj;
  }
}

module.exports = Embed;
