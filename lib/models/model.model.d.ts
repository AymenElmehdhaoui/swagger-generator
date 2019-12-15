import { Property } from "./property.model";
export declare class Model {
    modelName: string;
    fileName: string;
    properties: Property[];
    imports: {
        name: string;
        filePath: string;
    }[];
}
