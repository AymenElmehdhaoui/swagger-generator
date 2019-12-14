import {Parameter} from "./parameter.model";

export class Operation {
    endPoint: string = "";
    method: string = "";
    tags?: string;
    summary?: string;
    description?: string;
    operationId: string = "";
    parameters?: Parameter[];
    returnType: string = "any";
    httpParams?: string[];
    body?: {key: string, isComplex: boolean}[]
}
