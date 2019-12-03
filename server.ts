import {Config} from "./src/models/config.model";
import {Generate} from "./src/generate";

const config = new Config();

new Generate(config).doGenerate();
