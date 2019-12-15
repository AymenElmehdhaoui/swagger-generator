#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var chalk_1 = __importDefault(require("chalk"));
var clear_1 = __importDefault(require("clear"));
var figlet_1 = __importDefault(require("figlet"));
var commander_1 = __importDefault(require("commander"));
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
var server_1 = require("./server");
clear_1.default();
console.log(chalk_1.default.red(figlet_1.default.textSync('NGX-Swagger', { horizontalLayout: 'full' })));
console.log(chalk_1.default.red(figlet_1.default.textSync('@AYMEN', { horizontalLayout: 'full' })));
commander_1.default
    .version('1.0.2')
    .description("Angular Generator for Models and services from Swagger 2.0 config file")
    .requiredOption('-o, --output', 'Output path')
    .requiredOption('-i, --input', 'path to Swagger 2.0 json config file')
    .parse(process.argv);
if (!process.argv.slice(2).length) {
    commander_1.default.outputHelp();
    process.exit(0);
}
var args = commander_1.default.args;
var from = path_1.default.resolve(args[0]);
var to = path_1.default.resolve(args[1]);
fs_1.default.stat(from, function (errFrom, statsFrom) {
    if (!errFrom) {
        if (statsFrom.isFile()) {
            if (from.endsWith('.json')) {
                fs_1.default.stat(to, function (errTo, statsTo) {
                    if (!errTo) {
                        if (statsTo.isDirectory()) {
                            console.log(chalk_1.default.green("from:", from));
                            console.log(chalk_1.default.green("to:", to));
                            console.log(chalk_1.default.green("--------------------------------"));
                            server_1.doGenerate(args[0], args[1]);
                        }
                        else {
                            console.log('Output not folder');
                        }
                    }
                    else {
                        console.log(errTo);
                    }
                });
            }
            else {
                console.log('Not json file');
            }
        }
        else {
            console.error('Input not a file');
        }
    }
    else {
        console.error(errFrom);
    }
});
