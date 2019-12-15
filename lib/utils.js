"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var lodash_1 = require("lodash");
var Utils = /** @class */ (function () {
    function Utils() {
    }
    Utils.fileReader = function (path) {
        return rxjs_1.Observable.create(function (observer) {
            fs_1.default.readFile(path, function (err, data) {
                if (err) {
                    observer.error(err);
                }
                else {
                    observer.next(JSON.parse(data.toString()));
                    observer.complete();
                }
            });
        });
    };
    ;
    Utils.toFileName = function (typeName) {
        var result = '';
        var wasLower = false;
        for (var i = 0; i < typeName.length; i++) {
            var c = typeName.charAt(i);
            var isLower = /[a-z]/.test(c);
            if (!isLower && wasLower) {
                result += '-';
            }
            result += c.toLowerCase();
            wasLower = isLower;
        }
        return result;
    };
    Utils.toModelName = function (typeName) {
        return Utils.toFileName(typeName).concat('.').concat('model');
    };
    Utils.toServiceName = function (typeName) {
        return Utils.toFileName(typeName).concat('.').concat('service');
    };
    Utils.resolveRef = function (ref) {
        if (ref.indexOf('#/') != 0) {
            return ref;
        }
        var parts = ref.substr(2).split('/');
        if (parts && parts[parts.length - 1]) {
            return parts[parts.length - 1];
        }
        return '';
    };
    Utils.resoleTypeNumber = function (type) {
        var numberTypes = ['number', 'integer'];
        if (numberTypes.includes(type)) {
            return 'number';
        }
        return type;
    };
    Utils.capitalizeFirstLetter = function (str) {
        if (str.length === 0)
            return str;
        else if (str.length === 1)
            return str.toUpperCase();
        else
            return str[0].toUpperCase() + str.slice(1);
    };
    Utils.mkdirs = function (folderPath) {
        var folders = [];
        var tmpPath = path_1.default.normalize(folderPath);
        var exists = fs_1.default.existsSync(tmpPath);
        while (!exists) {
            folders.push(tmpPath);
            tmpPath = path_1.default.join(tmpPath, '..');
            exists = fs_1.default.existsSync(tmpPath);
        }
        for (var i = folders.length - 1; i >= 0; i--) {
            fs_1.default.mkdirSync(folders[i]);
        }
    };
    Utils.rmdir = function (folderPath) {
        if (fs_1.default.existsSync(folderPath)) {
            var files = fs_1.default.readdirSync(folderPath);
            files.map(function (fileName) {
                fs_1.default.unlinkSync(path_1.default.resolve(folderPath, fileName));
            });
            fs_1.default.rmdirSync(folderPath);
        }
    };
    Utils.resolveApiName = function (apiName) {
        if (!apiName) {
            return apiName;
        }
        else {
            var splits = apiName.split('/');
            return splits[splits.length - 1];
        }
    };
    Utils.generateOutDirFolder = function (outDir) {
        var folderPath = path_1.default.normalize(outDir);
        Utils.rmdir(folderPath);
        Utils.mkdirs(folderPath);
    };
    Utils.resolveServicePathParam = function (path) {
        if (!path) {
            return path;
        }
        else {
            return lodash_1.replace(path, new RegExp("{", "g"), "${");
        }
    };
    Utils.resolveOperationId = function (operationId) {
        if (!operationId) {
            return operationId;
        }
        else {
            return operationId.split(' ').join('');
        }
    };
    return Utils;
}());
exports.Utils = Utils;
