import { Property} from "./property.model";

export class Model {
    modelName: string = '';
    fileName: string = '';
    properties: Property[] = [];
    imports: Set<string> = new Set<string>();
}
