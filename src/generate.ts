import fs from "fs";
import path from "path";
import mustache from "mustache";
import {map, tap} from "rxjs/operators";
import {Observable} from "rxjs";

import {Config} from "./models/config.model";
import {Property} from "./models/property.model";
import {Model} from "./models/model.model";
import {Utils} from "./utils";
import _ from 'lodash';

export class Generate {
    public data$: Observable<any> = this.setData;
    public usedModels$: Observable<Model[]> = this.getModels;

    constructor(private config: Config) {
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

    doGenerate() {
        this.usedModels$
            .pipe(
                tap(
                    (models: Model[]) => {
                        const folderPath = path.resolve(__dirname, this.config.outDir);
                        Utils.rmdir(folderPath);
                        Utils.mkdirs(folderPath);
                    }
                ),
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



}
