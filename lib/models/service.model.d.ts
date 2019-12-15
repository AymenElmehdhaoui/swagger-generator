import { Operation } from "./operation.model";
export declare class Service {
    serviceName: string;
    fileName: string;
    operations: Operation[];
    imports: {
        name: string;
        filePath: string;
    }[];
    baseUrl: string;
}
