import {Config} from "./src/models/config.model";
import {Generate} from "./src/generate";

const config = new Config();

const generator = new Generate(config);
// generator.doGenerateModels();
generator.doGenerateServices();
