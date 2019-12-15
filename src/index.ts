#!/usr/bin/env node
import {doGenerate} from "./server";

const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const program = require('commander');

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

console.log(chalk.green("from:", args[0]));
console.log(chalk.green("to:", args[1]));
console.log(chalk.green("--------------------------------"));
doGenerate(args[0], args[1]);

