import { Observable } from "rxjs";
export declare class Utils {
    static fileReader(path: string): Observable<any>;
    static toFileName(typeName: string): string;
    static toModelName(typeName: string): string;
    static toServiceName(typeName: string): string;
    static resolveRef(ref: string): string;
    static resoleTypeNumber(type: string): string;
    static capitalizeFirstLetter(str: string): string;
    static mkdirs(folderPath: string): void;
    static rmdir(folderPath: string): void;
    static resolveApiName(apiName: string): string;
    static generateOutDirFolder(outDir: string): void;
    static resolveServicePathParam(path: string): string;
    static resolveOperationId(operationId: string): string;
}
