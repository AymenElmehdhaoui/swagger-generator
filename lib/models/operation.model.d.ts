import { Parameter } from "./parameter.model";
export declare class Operation {
    endPoint: string;
    method: string;
    tags?: string;
    summary?: string;
    description?: string;
    operationId: string;
    parameters?: Parameter[];
    returnType: string;
    httpParams?: string[];
    body?: {
        key: string;
        isComplex: boolean;
    }[];
}
