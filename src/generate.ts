import fs from "fs";
import path from "path";
import mustache from "mustache";
import {map, tap} from "rxjs/operators";
import {Observable, of} from "rxjs";
import {uniqBy as _uniqBy} from 'lodash';

import {Config} from "./models/config.model";
import {Property} from "./models/property.model";
import {Model} from "./models/model.model";
import {Utils} from "./utils";
import {Service} from "./models/service.model";
import {Parameter} from "./models/parameter.model";
import {Operation} from "./models/operation.model";
import {doGenerate} from "./server";
import chalk from "chalk";

export class Generate {
    private data$: Observable<any> = this.setData;
    private usedModels$: Observable<Model[]> = this.getModels;
    private usedService$: Observable<Service> = this.getServices;

    constructor(private config: Config) {
        Utils.generateOutDirFolder(config.outDir);
    }

    private get setData(): Observable<any> {
        const filePath = path.normalize(this.config.filePath);
        return Utils.fileReader(filePath);
    }

    private get getModels(): Observable<Model[]> {
        return this.data$
            .pipe(
                map(data => data.definitions),
                map(definitions => {
                    let data: any = {};
                    const keys = Object.keys(definitions || {});
                    keys.map(key => {
                        const elm = definitions[key];
                        const properties = elm.properties;

                        if (properties && elm && !properties.prgRedirectUrl) {
                            data[key] = elm;
                        }
                    });
                    return data;
                }),
                map(definitions => {
                    const models: Model[] = [];
                    const keys = Object.keys(definitions || {});
                    keys.map(key => {
                        const className: string = key;
                        const fileName: string = Utils.toModelName(className);
                        const definitionProperties = definitions[key].properties;
                        const definitionPropertiesKeys = Object.keys(definitionProperties);
                        const imports: { name: string, filePath: string }[] = [];

                        let properties: Property[] = [];

                        definitionPropertiesKeys.map((defKey: string) => {
                            const typesDef = definitionProperties[defKey];
                            let type = typesDef.type || typesDef.$ref;
                            const description = typesDef.format || (typesDef.enum ? "enum of " + typesDef.enum.toString() : null);
                            const p = new Property();

                            // complex type
                            if (typesDef.$ref) {
                                type = Utils.resolveRef(typesDef.$ref);
                                imports.push({name: type, filePath: Utils.toModelName(type)});
                            }
                            type = Utils.resoleTypeNumber(type);
                            if (type === 'array') {
                                if (typesDef.items.$ref) {
                                    p.of = Utils.resolveRef(typesDef.items.$ref);
                                    type = p.of.concat('[]');
                                    imports.push({name: p.of, filePath: Utils.toModelName(p.of)});
                                }
                            }

                            p.key = defKey;
                            p.type = type;
                            p.description = description;
                            properties.push(p);
                        });
                        const model = new Model();

                        model.fileName = fileName;
                        model.modelName = className;
                        model.properties = properties;
                        model.imports = _uniqBy(imports, "name");
                        models.push(model);
                    });
                    return models;
                })
            );
    }

    private get getServices(): Observable<Service> {
        return this.data$
            .pipe(
                map(data => {
                    const paths = data.paths;
                    const service: Service = new Service();
                    const pathsKeys = Object.keys(paths);
                    const imports: { name: string, filePath: string }[] = [];
                    const ops: Operation[] = [];

                    pathsKeys.map((pathKey) => {
                        const endPoint = pathKey;
                        const methods = paths[pathKey];
                        const methodsKeys = Object.keys(methods);

                        methodsKeys.map(methodKey => {
                            const op = new Operation();
                            op.endPoint = endPoint;
                            op.method = methodKey;

                            const methodData = methods[methodKey];
                            op.tags = (methodData.tags || []).join();
                            op.summary = methodData.summary;
                            op.description = methodData.description;
                            op.operationId = Utils.resolveOperationId(methodData.operationId);
                            const parametersMethod = methodData.parameters || [];
                            const params: Parameter[] = [];
                            parametersMethod.map((parameterMethod: any) => {
                                const param = new Parameter();
                                param.in = parameterMethod.in;
                                param.description = parameterMethod.description;
                                param.required = parameterMethod.required;
                                param.name = parameterMethod.name;

                                if (parameterMethod && parameterMethod.type === 'array'){
                                    const items = parameterMethod.items;
                                    if (items.$ref) {
                                        const ref = items.$ref;
                                        const schema = Utils.resolveRef(ref); // *
                                        const schemaFileName = Utils.toModelName(schema);
                                        param.schema = schema;
                                        imports.push({name: schema, filePath: schemaFileName});
                                    } else {
                                        param.schema = Utils.resoleTypeNumber(items.type || 'any').concat('[]');
                                    }

                                } else {
                                    if (parameterMethod.schema && parameterMethod.schema.$ref) {
                                        const schemaRef = parameterMethod.schema.$ref;
                                        const schema = Utils.resolveRef(schemaRef); // *
                                        const schemaFileName = Utils.toModelName(schema);
                                        param.schema = schema;
                                        imports.push({name: schema, filePath: schemaFileName});
                                    } else {
                                        param.schema = Utils.resoleTypeNumber(parameterMethod.type);
                                    }
                                }

                                params.push(param);
                            });
                            op.parameters = params;


                            if (methodData.responses && methodData.responses['200'] && methodData.responses['200'].schema) {
                                if (methodData.responses['200'].schema.$ref) {
                                    const resultTypeKey = Utils.resolveRef(methodData.responses['200'].schema.$ref);
                                    if (data && data.definitions && data.definitions[resultTypeKey] && data.definitions[resultTypeKey].properties) {
                                        const propertiesValue = data.definitions[resultTypeKey].properties.value;
                                        if (propertiesValue.type === 'array') {
                                            const items = propertiesValue.items;
                                            if (items.$ref) {
                                                const ref = Utils.resolveRef(items.$ref);
                                                op.returnType = ref;
                                                imports.push({name: ref, filePath: Utils.toModelName(ref)})
                                            } else {
                                                op.returnType = items.type;
                                            }

                                            op.returnType = op.returnType.concat('[]');
                                        } else {
                                            if (propertiesValue.$ref) {
                                                const ref = Utils.resolveRef(propertiesValue.$ref);
                                                op.returnType = ref;
                                                imports.push({name: ref, filePath: Utils.toModelName(ref)})
                                            } else {
                                                op.returnType = propertiesValue.type;//
                                            }
                                        }
                                    }
                                }
                            }

                            ops.push(op);
                        });
                    });
                    service.operations = ops;
                    service.imports = imports;

                    let baseUrl = '';
                    if(data.schemes && data.schemes.length) {
                        baseUrl = baseUrl.concat(data.schemes[0]);
                    } else {
                       baseUrl = baseUrl.concat('http');
                    }
                    baseUrl = baseUrl.concat('://');

                    if(data.host) {
                        baseUrl = baseUrl.concat(data.host);
                    } else {
                        baseUrl = baseUrl.concat('localhost:8080');
                    }
                    if(data.basePath) {
                        baseUrl = baseUrl.concat(data.basePath);
                    }
                    service.baseUrl = baseUrl;
                    return service;
                }),
                map(service => {
                    service.imports = _uniqBy(service.imports, 'name');
                    return service;
                }),
                map(service => {
                    service.operations = service.operations.map((operation) => {
                        if (operation.parameters) {
                            operation.parameters.map(param => {
                                if (param.in === 'query') {
                                    if (!operation.httpParams) {
                                        operation.httpParams= [];
                                    }
                                    operation.httpParams.push(param.name);
                                }
                                if (param.in === 'body') {
                                    if (!operation.body) {
                                        operation.body= [];
                                    }
                                    let isComplex = false;
                                    service.imports.map(elm => {
                                        if(elm.name === param.schema && isComplex === false) {
                                            isComplex = true;
                                        }
                                    });
                                    operation.body.push({key: param.name, isComplex});
                                }
                                return param;
                            });
                        }
                        return operation;
                    });
                    return service;
                }),
                map(service => {
                    service.operations = (service.operations || []).map(operation => {
                        operation.endPoint = Utils.resolveServicePathParam(operation.endPoint);
                       return operation;
                    });
                    return service;
                })
            );
    }

    public doGenerateModels(): void {
        this.usedModels$
            .pipe(
                tap(
                    (models: Model[]) => {
                        models.map((model: Model) => {
                            const viewPath = path.resolve('./src/templates/model.mustache');
                            const template = fs.readFileSync(viewPath, 'utf-8').toString();
                            const modelCopy: any = {...model};
                            modelCopy.imports = Array.from(model.imports);
                            const data = mustache.render(template, modelCopy);
                            const to = path.join(this.config.outDir, model.fileName.concat('.ts'));
                            fs.writeFileSync(to, data, 'UTF-8');

                            console.log(chalk.green("Generate model:", model.fileName));
                        });
                    }
                )
            )
            .subscribe()
    }

    public doGenerateServices(): void {
        this.usedService$
            .pipe(
                tap((service: Service) => {
                    const viewPath = path.resolve('./src/templates/service.mustache');
                    const template = fs.readFileSync(viewPath, 'utf-8').toString();
                    const data = mustache.render(template, service);
                    const to = path.join(this.config.outDir, service.fileName.concat('.ts'));

                    console.log(chalk.green("Generate Service:", service.fileName));
                    fs.writeFileSync(to, data, 'UTF-8');
                })
            )
            .subscribe()
    }


}
