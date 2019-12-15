"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var chalk_1 = __importDefault(require("chalk"));
var config_model_1 = require("./models/config.model");
var generate_1 = require("./generate");
exports.doGenerate = function (i, o) {
    var config = new config_model_1.Config();
    config.filePath = i;
    config.outDir = o;
    console.log(chalk_1.default.green("Start the engines......"));
    console.log(chalk_1.default.green("--------------------------------"));
    var generator = new generate_1.Generate(config);
    generator.doGenerateModels();
    generator.doGenerateServices();
};
