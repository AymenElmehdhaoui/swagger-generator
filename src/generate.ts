import fs from "fs";
import path from "path";
import mustache from "mustache";
import {map, tap} from "rxjs/operators";
import {Observable, of} from "rxjs";
import _ from 'lodash';

import {Config} from "./models/config.model";
import {Property} from "./models/property.model";
import {Model} from "./models/model.model";
import {Utils} from "./utils";
import {Service} from "./models/service.model";
import {Parameter} from "./models/parameter.model";
import {Operation} from "./models/operation.model";

export class Generate {
    private data$: Observable<any> = this.setData;
    private usedModels$: Observable<Model[]> = this.getModels;
    private usedService$: Observable<Service> = this.getServices;

    constructor(private config: Config) {
        Utils.generateOutDirFolder(config.outDir);
    }

    private get setData(): Observable<any> {
        const filePath = path.resolve(this.config.filePath);
        return  Utils.fileReader(filePath);
    }

    private get getModels(): Observable<Model[]> {
        return this.data$
            .pipe(
                map(data => data.definitions),
                map(definitions => {
                    let data: any = {};
                    const keys = Object.keys(definitions);
                    keys.map(key => {
                        const elm = definitions[key];
                        const properties = elm.properties;

                        if (properties && elm && !properties.prgRedirectUrl ) {
                            data[key] =  elm;
                        }
                    });
                    return data;
                }),
                map(definitions => {
                    const models: Model[] = [];
                    const keys = Object.keys(definitions);
                    keys.map(key => {
                        const className: string = key;
                        const fileName: string = Utils.toModelName(className);
                        const definitionProperties = definitions[key].properties;
                        const definitionPropertiesKeys = Object.keys(definitionProperties);
                        const imports: {name: string, filePath: string}[] = [];

                        let properties: Property[] = [];

                        definitionPropertiesKeys.map((defKey: string) => {
                            const typesDef = definitionProperties[defKey];
                            let type = typesDef.type || typesDef.$ref;
                            const description = typesDef.format || (typesDef.enum ? "enum of " + typesDef.enum.toString() : null);
                            const p = new Property();

                            // complex type
                            if(typesDef.$ref) {
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
                        model.imports = _.uniqBy(imports, "name");
                        models.push(model);
                    });
                    return models;
                })
            );
    }

    private get getServices(): Observable<Service> {
        return this.data$
            .pipe(
                map(data => data.paths),
                map(paths => {
                    const service: Service = new Service();
                    const pathsKeys = Object.keys(paths);
                    const imports: {name: string, filePath: string}[] = [];
                    pathsKeys.map((pathKey) => {
                        const endPoint = pathKey;
                        const methods = paths[pathKey];
                        const methodsKeys = Object.keys(methods);

                        const ops: Operation[] = [];

                        methodsKeys.map(methodKey => {
                            const op = new Operation();
                            op.endPoint = endPoint;
                            op.method = methodKey;

                            const methodData = methods[methodKey];
                            op.tags = methodData.tags;
                            op.summary = methodData.summary;
                            op.description = methodData.description;
                            op.operationId = methodData.operationId;
                            const parametersMethod = methodData.parameters;
                            const params: Parameter[] = [];
                            parametersMethod.map((parameterMethod: any) => {
                                const param = new Parameter();
                                param.in = parameterMethod.in;
                                param.description = parameterMethod.description;
                                param.required = parameterMethod.required;
                                if(parameterMethod.schema && parameterMethod.schema.$ref) {
                                    const schemaRef = parameterMethod.schema.$ref;
                                    const schema = Utils.resolveRef(schemaRef); // *
                                    const schemaFileName = Utils.toModelName(schema);
                                    param.schema = schema;
                                    imports.push({name: schema, filePath: schemaFileName});
                                }
                                params.push(param);
                            });
                            op.parameters = params;
                            ops.push(op);
                        });

                        service.operations = ops;
                    });
                    service.imports = imports;
                    return service;
                }),
                map(service => {
                    service.imports = _.uniqBy(service.imports, 'name');
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
                            const viewPath = path.resolve(__dirname, 'templates/model.mustache');
                            const template = fs.readFileSync(viewPath, 'utf-8').toString();
                            const modelCopy: any = {...model};
                            modelCopy.imports = Array.from(model.imports);
                            const data = mustache.render(template, modelCopy);
                            const to = path.resolve(__dirname, this.config.outDir, model.fileName.concat('.ts'));
                            fs.writeFileSync(to, data, 'UTF-8');
                        });
                    }
                )
            )
            .subscribe(console.log)
    }

    public doGenerateServices(): void {
        this.usedService$
            .pipe(
                tap((service: Service) => {
                    const viewPath = path.resolve(__dirname, 'templates/service.mustache');
                    const template = fs.readFileSync(viewPath, 'utf-8').toString();
                    const data = mustache.render(template, service);
                    const to = path.resolve(__dirname, this.config.outDir, service.fileName.concat('.ts'));
                    fs.writeFileSync(to, data, 'UTF-8');
                })
            )
            .subscribe(console.log)
    }



}
