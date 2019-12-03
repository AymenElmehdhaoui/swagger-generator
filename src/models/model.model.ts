import { Property} from "./property.model";

export class Model {
    modelName: string = '';
    fileName: string = '';
    properties: Property[] = [];
    imports: Set<{name: string, filePath: string}> = new Set<{name: string, filePath: string}>();
}
