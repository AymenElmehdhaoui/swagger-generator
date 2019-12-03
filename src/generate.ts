import {Config} from "./models/config.model";
import fs from "fs";
import path from "path";
import {Observable} from "rxjs";
import {map} from "rxjs/operators";
import {Property} from "./models/property.model";
import {Model} from "./models/model.model";
import {Utils} from "./utils";

import mustache from "mustache";

export class Generate {
    public data$: Observable<any> = this.setData;
    public usedModels$: Observable<Model[]> = this.getModels;

    constructor(private config: Config) {
    }

    private get setData(): Observable<any> {
        const filePath = path.resolve('.', this.config.filePath);

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
                        const imports = new Set<{name: string, filePath: string}>();

                        let properties: Property[] = [];

                        definitionPropertiesKeys.map((defKey: string) => {
                            const typesDef = definitionProperties[defKey];
                            let type = typesDef.type || typesDef.$ref;
                            const p = new Property();

                            // complex type
                            if(typesDef.$ref) {
                                type = Utils.resolveRef(typesDef.$ref);

                                imports.add({name: type, filePath: Utils.toModelName(type)});
                            }
                            type = Utils.resoleTypeNumber(type);
                            if (type === 'array') {
                                if (typesDef.items.$ref) {
                                    p.of = Utils.resolveRef(typesDef.items.$ref);
                                    type = p.of.concat('[]');
                                    imports.add({name: p.of, filePath: Utils.toModelName(p.of)});
                                }
                            }

                            p.key = defKey;
                            p.type = type;
                            properties.push(p);
                        });
                        const model = new Model();

                        model.fileName = fileName;
                        model.modelName = className;
                        model.properties = properties;
                        model.imports = imports;
                        models.push(model);
                    });
                    return models;
                })
            );
    }

    doGenerate() {
        this.usedModels$
            .pipe(
                map(
                    (models: Model[]) => {
                        const folderPath = path.resolve('.', 'src', this.config.outDir);
                        Utils.mkdirs(folderPath);
                        return models;
                    }
                ),
                map(
                    (models: Model[]) => {
                        models.map((model: Model) => {
                            const viewPath = path.resolve('.', 'src/templates/model.mustache');
                            const template = fs.readFileSync(viewPath, 'utf-8').toString();
                            const modelCopy: any = {...model};
                            modelCopy.imports = Array.from(model.imports);
                            const data = mustache.render(template, modelCopy);
                            const to = path.resolve('.', 'src', this.config.outDir, model.fileName.concat('.ts'));
                            fs.writeFileSync(to, data, 'UTF-8');
                        });
                        return models;
                    }
                )
            )
            .subscribe(console.log)
    }



}
