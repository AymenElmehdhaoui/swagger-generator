#!/usr/bin/env node
import chalk from "chalk";
import clear from "clear";
import figlet from "figlet";
import program from "commander";
import path from "path";
import fs from "fs";

import {doGenerate} from "./server";

clear();
console.log(
    chalk.red(
        figlet.textSync('NGX-Swagger', { horizontalLayout: 'full' })
    )
);

console.log(
    chalk.red(
        figlet.textSync('@AYMEN', { horizontalLayout: 'full' })
    )
);

program
    .version('1.0.2')
    .description("Angular Generator for Models and services from Swagger 2.0 config file")
    .requiredOption('-o, --output', 'Output path')
    .requiredOption('-i, --input', 'path to Swagger 2.0 json config file')
    .parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
    process.exit(0);
}

const args = program.args;
const from = path.resolve(args[0]);
const to = path.resolve(args[1]);

fs.stat(from, (errFrom, statsFrom) => {
    if (!errFrom) {
        if (statsFrom.isFile()) {
            if (from.endsWith('.json')) {
                fs.stat(to, (errTo, statsTo) => {
                    if(!errTo) {
                        if (statsTo.isDirectory()) {
                            console.log(chalk.green("from:", from));
                            console.log(chalk.green("to:", to));
                            console.log(chalk.green("--------------------------------"));
                            doGenerate(args[0], args[1]);
                        } else {
                            console.log('Output not folder')
                        }
                    } else {
                        console.log(errTo);
                    }
                });
            } else {
                console.log('Not json file')
            }
        } else {
            console.error('Input not a file')
        }
    } else {
        console.error(errFrom);
    }
});

