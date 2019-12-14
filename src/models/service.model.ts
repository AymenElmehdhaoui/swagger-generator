import {Operation} from "./operation.model";

export class Service {
    serviceName: string = 'BaseService';
    fileName: string = 'base-service.service';
    operations: Operation[] = [];
    imports: {name: string, filePath: string}[] = [];
    baseUrl: string = '';
}
