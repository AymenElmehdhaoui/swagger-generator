import {Parameter} from "./parameter.model";

export class Operation {
    endPoint: string = "";
    method: string = "";
    tags?: string[];
    summary?: string;
    description?: string;
    operationId: string = "";
    parameters?: Parameter[];
}
