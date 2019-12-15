import { Config } from "./models/config.model";
export declare class Generate {
    private config;
    private data$;
    private usedModels$;
    private usedService$;
    constructor(config: Config);
    private get setData();
    private get getModels();
    private get getServices();
    doGenerateModels(): void;
    doGenerateServices(): void;
}
