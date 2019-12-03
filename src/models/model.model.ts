import { Property} from "./property.model";

export class Model {
    modelName: string = '';
    fileName: string = '';
    properties: Property[] = [];
    imports: {name: string, filePath: string}[] = [];
}
