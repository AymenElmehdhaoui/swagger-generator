"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var mustache_1 = __importDefault(require("mustache"));
var operators_1 = require("rxjs/operators");
var chalk_1 = __importDefault(require("chalk"));
var lodash_1 = require("lodash");
var property_model_1 = require("./models/property.model");
var model_model_1 = require("./models/model.model");
var service_model_1 = require("./models/service.model");
var parameter_model_1 = require("./models/parameter.model");
var operation_model_1 = require("./models/operation.model");
var utils_1 = require("./utils");
var Generate = /** @class */ (function () {
    function Generate(config) {
        this.config = config;
        this.data$ = this.setData;
        this.usedModels$ = this.getModels;
        this.usedService$ = this.getServices;
    }
    Object.defineProperty(Generate.prototype, "setData", {
        get: function () {
            var filePath = path_1.default.resolve(this.config.filePath);
            var data = utils_1.Utils.fileReader(filePath);
            return data.pipe(operators_1.map(function (d) {
                if (d && d.swagger) {
                    return d;
                }
                else {
                    process.exit(0);
                }
            }));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Generate.prototype, "getModels", {
        get: function () {
            return this.data$
                .pipe(operators_1.map(function (data) { return data.definitions; }), operators_1.map(function (definitions) {
                var data = {};
                var keys = Object.keys(definitions || {});
                keys.map(function (key) {
                    var elm = definitions[key];
                    var properties = elm.properties;
                    if (properties && elm && !properties.prgRedirectUrl) {
                        data[key] = elm;
                    }
                });
                return data;
            }), operators_1.map(function (definitions) {
                var models = [];
                var keys = Object.keys(definitions || {});
                keys.map(function (key) {
                    var className = key;
                    var fileName = utils_1.Utils.toModelName(className);
                    var definitionProperties = definitions[key].properties;
                    var definitionPropertiesKeys = Object.keys(definitionProperties);
                    var imports = [];
                    var properties = [];
                    definitionPropertiesKeys.map(function (defKey) {
                        var typesDef = definitionProperties[defKey];
                        var type = typesDef.type || typesDef.$ref;
                        var description = typesDef.format || (typesDef.enum ? "enum of " + typesDef.enum.toString() : null);
                        var p = new property_model_1.Property();
                        // complex type
                        if (typesDef.$ref) {
                            type = utils_1.Utils.resolveRef(typesDef.$ref);
                            imports.push({ name: type, filePath: utils_1.Utils.toModelName(type) });
                        }
                        type = utils_1.Utils.resoleTypeNumber(type);
                        if (type === 'array') {
                            if (typesDef.items.$ref) {
                                p.of = utils_1.Utils.resolveRef(typesDef.items.$ref);
                                type = p.of.concat('[]');
                                imports.push({ name: p.of, filePath: utils_1.Utils.toModelName(p.of) });
                            }
                        }
                        p.key = defKey;
                        p.type = type;
                        p.description = description;
                        properties.push(p);
                    });
                    var model = new model_model_1.Model();
                    model.fileName = fileName;
                    model.modelName = className;
                    model.properties = properties;
                    model.imports = lodash_1.uniqBy(imports, "name");
                    models.push(model);
                });
                return models;
            }));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Generate.prototype, "getServices", {
        get: function () {
            return this.data$
                .pipe(operators_1.map(function (data) {
                var paths = data.paths;
                var service = new service_model_1.Service();
                var pathsKeys = Object.keys(paths);
                var imports = [];
                var ops = [];
                pathsKeys.map(function (pathKey) {
                    var endPoint = pathKey;
                    var methods = paths[pathKey];
                    var methodsKeys = Object.keys(methods);
                    methodsKeys.map(function (methodKey) {
                        var op = new operation_model_1.Operation();
                        op.endPoint = endPoint;
                        op.method = methodKey;
                        var methodData = methods[methodKey];
                        op.tags = (methodData.tags || []).join();
                        op.summary = methodData.summary;
                        op.description = methodData.description;
                        op.operationId = utils_1.Utils.resolveOperationId(methodData.operationId);
                        var parametersMethod = methodData.parameters || [];
                        var params = [];
                        parametersMethod.map(function (parameterMethod) {
                            var param = new parameter_model_1.Parameter();
                            param.in = parameterMethod.in;
                            param.description = parameterMethod.description;
                            param.required = parameterMethod.required;
                            param.name = parameterMethod.name;
                            if (parameterMethod && parameterMethod.type === 'array') {
                                var items = parameterMethod.items;
                                if (items.$ref) {
                                    var ref = items.$ref;
                                    var schema = utils_1.Utils.resolveRef(ref); // *
                                    var schemaFileName = utils_1.Utils.toModelName(schema);
                                    param.schema = schema;
                                    imports.push({ name: schema, filePath: schemaFileName });
                                }
                                else {
                                    param.schema = utils_1.Utils.resoleTypeNumber(items.type || 'any').concat('[]');
                                }
                            }
                            else {
                                if (parameterMethod.schema && parameterMethod.schema.$ref) {
                                    var schemaRef = parameterMethod.schema.$ref;
                                    var schema = utils_1.Utils.resolveRef(schemaRef); // *
                                    var schemaFileName = utils_1.Utils.toModelName(schema);
                                    param.schema = schema;
                                    imports.push({ name: schema, filePath: schemaFileName });
                                }
                                else {
                                    param.schema = utils_1.Utils.resoleTypeNumber(parameterMethod.type);
                                }
                            }
                            params.push(param);
                        });
                        op.parameters = params;
                        if (methodData.responses && methodData.responses['200'] && methodData.responses['200'].schema) {
                            if (methodData.responses['200'].schema.$ref) {
                                var resultTypeKey = utils_1.Utils.resolveRef(methodData.responses['200'].schema.$ref);
                                if (data && data.definitions && data.definitions[resultTypeKey] && data.definitions[resultTypeKey].properties) {
                                    var propertiesValue = data.definitions[resultTypeKey].properties.value;
                                    if (propertiesValue.type === 'array') {
                                        var items = propertiesValue.items;
                                        if (items.$ref) {
                                            var ref = utils_1.Utils.resolveRef(items.$ref);
                                            op.returnType = ref;
                                            imports.push({ name: ref, filePath: utils_1.Utils.toModelName(ref) });
                                        }
                                        else {
                                            op.returnType = items.type;
                                        }
                                        op.returnType = op.returnType.concat('[]');
                                    }
                                    else {
                                        if (propertiesValue.$ref) {
                                            var ref = utils_1.Utils.resolveRef(propertiesValue.$ref);
                                            op.returnType = ref;
                                            imports.push({ name: ref, filePath: utils_1.Utils.toModelName(ref) });
                                        }
                                        else {
                                            op.returnType = propertiesValue.type; //
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
                var baseUrl = '';
                if (data.schemes && data.schemes.length) {
                    baseUrl = baseUrl.concat(data.schemes[0]);
                }
                else {
                    baseUrl = baseUrl.concat('http');
                }
                baseUrl = baseUrl.concat('://');
                if (data.host) {
                    baseUrl = baseUrl.concat(data.host);
                }
                else {
                    baseUrl = baseUrl.concat('localhost:8080');
                }
                if (data.basePath) {
                    baseUrl = baseUrl.concat(data.basePath);
                }
                service.baseUrl = baseUrl;
                return service;
            }), operators_1.map(function (service) {
                service.imports = lodash_1.uniqBy(service.imports, 'name');
                return service;
            }), operators_1.map(function (service) {
                service.operations = service.operations.map(function (operation) {
                    if (operation.parameters) {
                        operation.parameters.map(function (param) {
                            if (param.in === 'query') {
                                if (!operation.httpParams) {
                                    operation.httpParams = [];
                                }
                                operation.httpParams.push(param.name);
                            }
                            if (param.in === 'body') {
                                if (!operation.body) {
                                    operation.body = [];
                                }
                                var isComplex_1 = false;
                                service.imports.map(function (elm) {
                                    if (elm.name === param.schema && isComplex_1 === false) {
                                        isComplex_1 = true;
                                    }
                                });
                                operation.body.push({ key: param.name, isComplex: isComplex_1 });
                            }
                            return param;
                        });
                    }
                    return operation;
                });
                return service;
            }), operators_1.map(function (service) {
                service.operations = (service.operations || []).map(function (operation) {
                    operation.endPoint = utils_1.Utils.resolveServicePathParam(operation.endPoint);
                    return operation;
                });
                return service;
            }));
        },
        enumerable: true,
        configurable: true
    });
    Generate.prototype.doGenerateModels = function () {
        var _this = this;
        this.usedModels$
            .pipe(operators_1.tap(function (models) {
            var template = utils_1.Utils.getTemplate('./src/templates/model.mustache');
            models.map(function (model) {
                var modelCopy = __assign({}, model);
                modelCopy.imports = Array.from(model.imports);
                var data = mustache_1.default.render(template, modelCopy);
                var to = path_1.default.join(_this.config.outDir, model.fileName.concat('.ts'));
                fs_1.default.writeFileSync(to, data, 'UTF-8');
                console.log(chalk_1.default.green("Generate model:", model.fileName));
            });
        }))
            .subscribe();
    };
    Generate.prototype.doGenerateServices = function () {
        var _this = this;
        this.usedService$
            .pipe(operators_1.tap(function (service) {
            var template = utils_1.Utils.getTemplate('/src/templates/service.mustache');
            var data = mustache_1.default.render(template, service);
            var to = path_1.default.join(_this.config.outDir, service.fileName.concat('.ts'));
            console.log(chalk_1.default.green("Generate Service:", service.fileName));
            fs_1.default.writeFileSync(to, data, 'UTF-8');
        }))
            .subscribe();
    };
    return Generate;
}());
exports.Generate = Generate;
