import {Observable, Observer} from "rxjs";
import fs from "fs";
import path from "path";
import { replace as _replace} from "lodash";

export class Utils {
    static fileReader (path: string): Observable<any> {
        return Observable.create((observer: Observer<any>) => {
            fs.readFile(path, (err, data) => {
                if (err) {
                    observer.error(err);
                } else {
                    observer.next(JSON.parse(data.toString()));
                    observer.complete();
                }
            });
        });
    };

    static toFileName(typeName: string): string {
        let result = '';
        let wasLower = false;
        for (let i = 0; i < typeName.length; i++) {
            const c = typeName.charAt(i);
            const isLower = /[a-z]/.test(c);
            if (!isLower && wasLower) {
                result += '-';
            }
            result += c.toLowerCase();
            wasLower = isLower;
        }
        return result;
    }

    static toModelName(typeName: string): string {
        return Utils.toFileName(typeName).concat('.').concat('model');
    }

    static toServiceName(typeName: string): string {
        return Utils.toFileName(typeName).concat('.').concat('service');
    }

    static resolveRef(ref: string): string {
        if (ref.indexOf('#/') != 0) {
            return ref;
        }
        const parts = ref.substr(2).split('/');
        if (parts && parts[parts.length - 1]) {
            return parts[parts.length - 1]
        }
        return '';
    }

    static resoleTypeNumber(type: string): string {
        const numberTypes = ['number', 'integer'];
        if(numberTypes.includes(type)){
            return 'number';
        }
        return type;
    }

    static capitalizeFirstLetter(str: string) {
        if (str.length === 0)
            return str;
        else if(str.length === 1)
            return str.toUpperCase();
        else return str[0].toUpperCase() + str.slice(1);
    }

    static mkdirs(folderPath: string) {
        const folders = [];
        let tmpPath = path.normalize(folderPath);
        let exists = fs.existsSync(tmpPath);
        while (!exists) {
            folders.push(tmpPath);
            tmpPath = path.join(tmpPath, '..');
            exists = fs.existsSync(tmpPath);
        }

        for (let i = folders.length - 1; i >= 0; i--) {
            fs.mkdirSync(folders[i]);
        }
    }

    static rmdir(folderPath: string) {
        if (fs.existsSync(folderPath)) {
            const files = fs.readdirSync(folderPath);
            files.map(fileName => {
                fs.unlinkSync(path.resolve(folderPath, fileName));
            });

            fs.rmdirSync(folderPath);
        }
    }

    static resolveApiName(apiName: string): string {
        if (!apiName) {
            return apiName;
        } else {
            const splits = apiName.split('/');
            return splits[splits.length - 1];
        }
    }

    static generateOutDirFolder(outDir: string): void {
        const folderPath = path.normalize(outDir);
        Utils.rmdir(folderPath);
        Utils.mkdirs(folderPath);
    }

    static resolveServicePathParam(path: string): string {
        if(!path) {
            return path;
        } else {
            return _replace(path, new RegExp("{","g"),"${");
        }
    }

    static resolveOperationId(operationId: string): string {
        if(!operationId) {
            return operationId;
        } else {
            return operationId.split(' ').join('');
        }
    }
}
