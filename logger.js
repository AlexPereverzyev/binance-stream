'use strict';

class Logger {
    constructor(newLine = true) {
        this.out = process.stdout;
        this.newLine = newLine ? '\n' : '';
    }

    error(message) {
        this.out.write(this.format(message, ColorPalette.FgRed));
    }

    warn(message) {
        this.out.write(this.format(message, ColorPalette.FgYellow));
    }

    info(message) {
        this.out.write(this.format(message, ColorPalette.FgBlue));
    }

    debug(message) {
        this.out.write(this.format(message, ColorPalette.FgGreen));
    }

    format(item, color = ColorPalette.FgBlue) {
        if (item instanceof Error) {
            item = Object.assign({ message: item.message && item.message.replace('\n', ' ') }, item);
        }
        if (typeof item === 'object') {
            item = JSON.stringify(item);
        }

        return `${color}${JSON.stringify({ log: item })}${ColorPalette.Reset}${this.newLine}`;
    }
}

const ColorPalette = {
    Reset: "\x1b[0m",
    FgRed: "\x1b[31m",
    FgYellow: "\x1b[33m",
    FgBlue: "\x1b[34m",
    FgGreen: "\x1b[32m",
    FgMagenta: "\x1b[35m",
    FgCyan: "\x1b[36m"
};

module.exports.Logger = Logger;

let _instance;

module.exports.current = function () {
    if (!_instance) {
        _instance = new Logger();
    }
    return _instance;
};
