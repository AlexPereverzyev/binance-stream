'use strict';

const { Transform } = require('stream');

class FormatterStream extends Transform {
    constructor(colors = true, newLine = false) {
        super({ objectMode: false });
        this.colors = colors;
        this.prevColor = ColorPalette.Bright;
        this.newLine = newLine ? '\n' : '';
    }

    _transform(data, encoding, callback) {
        let formated = data;

        if (this.colors) {
            formated = `${this.randomColor()}${data}${ColorPalette.Reset}${this.newLine}`;
        }

        this.push(formated);
        callback();
    };

    randomColor() {
        let color;
        do {
            color = ColorPalette[
                ColorKeys[
                    Math.round(Math.random() * (ColorKeys.length - 2)) + 1
                ]
            ];
        } while (color === this.prevColor);

        this.prevColor = color;

        return color;
    }
}

const ColorPalette = {
    Reset: "\x1b[0m",
    BgRed: "\x1b[41m",
    BgGreen: "\x1b[42m",
    BgBlue: "\x1b[44m",
    BgMagenta: "\x1b[45m",
    BgCyan: "\x1b[46m",
};

const ColorKeys = Object.keys(ColorPalette);

module.exports.FormatterStream = FormatterStream;
