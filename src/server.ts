import chalk from "chalk";
import {Config} from "./models/config.model";
import {Generate} from "./generate";

export const doGenerate = (i: string, o: string) => {
    const config = new Config();
    config.filePath = i;
    config.outDir = o;

    console.log(chalk.green("Start the engines......"));
    console.log(chalk.green("--------------------------------"));

    const generator = new Generate(config);
    generator.doGenerateModels();
    generator.doGenerateServices();
};
