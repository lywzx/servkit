"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sappSDK = exports.SappSDK = void 0;
var ServTerminal_1 = require("../terminal/ServTerminal");
var index_1 = require("../common/index");
var ServChannel_1 = require("../session/channel/ServChannel");
var Servkit_1 = require("../servkit/Servkit");
var ServService_1 = require("../service/ServService");
var SappLifecycle_1 = require("./service/s/SappLifecycle");
var SappLifecycle_2 = require("./service/m/SappLifecycle");
var Deferred_1 = require("../common/Deferred");
/**
 * SappSDK是为Servkit应用提供的一个SDK
 */
var SappSDK = /** @class */ (function () {
    function SappSDK() {
        var _this = this;
        /**
         * 启动SDK
         *
         * @param {SappSDKStartOptions} [options]
         * @returns {Promise<void>}
         * @memberof SappSDK
         */
        this.start = Deferred_1.DeferredUtil.reEntryGuard(function (options) { return __awaiter(_this, void 0, void 0, function () {
            var config, params, data, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isStarted) {
                            return [2 /*return*/];
                        }
                        config = this.config;
                        if (!config) {
                            throw new Error('[SAPPSDK] Config must be set before setup');
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 11, , 12]);
                        options = options || {};
                        return [4 /*yield*/, this.beforeStart(options)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.resolveStartParams(options)];
                    case 3:
                        params = _a.sent();
                        return [4 /*yield*/, this.beforeInitTerminal()];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, this.initTerminal(options, params)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, this.afterInitTerminal()];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, this.initSDK()];
                    case 7:
                        _a.sent();
                        this.isStarted = true;
                        return [4 /*yield*/, this.afterStart()];
                    case 8:
                        _a.sent();
                        return [4 /*yield*/, this.service(SappLifecycle_2.SappLifecycle).then(function (service) {
                                return service.getStartData();
                            }).catch(function (error) {
                                index_1.asyncThrow(error);
                                index_1.asyncThrow(new Error('[SAPPSDK] Can\'t get start datas from SAPP'));
                            })];
                    case 9:
                        data = _a.sent();
                        return [4 /*yield*/, this.onCreate(params, data)];
                    case 10:
                        _a.sent();
                        this.started.resolve();
                        this.service(SappLifecycle_2.SappLifecycle).then(function (service) {
                            return service.onStart();
                        }).catch(function (error) {
                            index_1.asyncThrow(error);
                            index_1.asyncThrow(new Error('[SAPPSDK] Can\'t notify onStart to SAPP'));
                        });
                        return [3 /*break*/, 12];
                    case 11:
                        e_1 = _a.sent();
                        this.onStartFailed();
                        this.isStarted = false;
                        this.started.reject();
                        throw e_1;
                    case 12: return [2 /*return*/];
                }
            });
        }); });
        this.started = Deferred_1.DeferredUtil.create();
        this.setConfig({
        // Default Config
        });
    }
    /**
     * SappSDK的全局配置，需要在start之前设定好
     *
     * @param {SappSDKConfig} config
     * @returns this
     * @memberof SappSDK
     */
    SappSDK.prototype.setConfig = function (config) {
        this.config = config;
        return this;
    };
    /**
     * 获取全局配置
     *
     * @returns
     * @memberof SappSDK
     */
    SappSDK.prototype.getConfig = function () {
        return this.config;
    };
    SappSDK.prototype.show = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.service(SappLifecycle_2.SappLifecycle).then(function (service) {
                        return service.show(params);
                    })];
            });
        });
    };
    SappSDK.prototype.hide = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.service(SappLifecycle_2.SappLifecycle).then(function (service) {
                        return service.hide(params);
                    })];
            });
        });
    };
    SappSDK.prototype.close = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.service(SappLifecycle_2.SappLifecycle).then(function (service) {
                        return service.close();
                    })];
            });
        });
    };
    /**
     * 销毁SDK，该方法主要用于CI测试（建议业务不要使用，因为SappSDK生命周期通常与应用程序的生命周期保一致）
     */
    SappSDK.prototype.destroy = function () {
        if (!this.isStarted) {
            return;
        }
        this.isStarted = false;
        this.started = Deferred_1.DeferredUtil.create();
        if (this.terminal) {
            this.terminal.servkit.destroyTerminal(this.terminal);
            this.terminal = undefined;
        }
    };
    SappSDK.prototype.getService = function () {
        if (!this.isStarted) {
            return;
        }
        return this.terminal.client.getService(arguments[0]);
    };
    SappSDK.prototype.getServiceUnsafe = function () {
        return this.getService.apply(this, arguments);
    };
    SappSDK.prototype.service = function () {
        if (!this.isStarted) {
            return Promise.reject(new Error('[SAPPSDK] SappSDK is not started'));
        }
        return this.terminal.client.service.apply(this.terminal.client, arguments);
    };
    SappSDK.prototype.serviceExec = function () {
        if (!this.isStarted) {
            return null;
        }
        return this.terminal.client.serviceExec.apply(this.terminal.client, arguments);
    };
    SappSDK.prototype.beforeStart = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config.beforeStart) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.config.beforeStart(this)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    SappSDK.prototype.afterStart = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config.afterStart) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.config.afterStart(this)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    SappSDK.prototype.onStartFailed = function () {
        if (this.terminal) {
            this.terminal.servkit.destroyTerminal(this.terminal);
        }
        this.terminal = undefined;
    };
    SappSDK.prototype.resolveStartParams = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var resolveParams, params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        resolveParams = undefined;
                        if (options.params) {
                            resolveParams =
                                typeof options.params === 'function'
                                    ? options.params
                                    : (function () { return options.params; });
                        }
                        else {
                            resolveParams = this.config.resolveStartParams || index_1.parseServQueryParams;
                        }
                        return [4 /*yield*/, resolveParams(this)];
                    case 1:
                        params = _a.sent();
                        return [2 /*return*/, params];
                }
            });
        });
    };
    SappSDK.prototype.beforeInitTerminal = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    SappSDK.prototype.initTerminal = function (options, params) {
        return __awaiter(this, void 0, void 0, function () {
            var config, terminalConfig, _a, _b, _c, newTerminalConfig, self, SappLifecycleImpl;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        config = this.config;
                        terminalConfig = {
                            id: params.uuid || '',
                            type: ServTerminal_1.EServTerminal.SLAVE,
                            session: undefined,
                        };
                        if (!config.resolveServiceClientConfig) return [3 /*break*/, 2];
                        _a = terminalConfig;
                        return [4 /*yield*/, config.resolveServiceClientConfig(this)];
                    case 1:
                        _a.client = _d.sent();
                        _d.label = 2;
                    case 2:
                        if (!config.resolveServiceServerConfig) return [3 /*break*/, 4];
                        _b = terminalConfig;
                        return [4 /*yield*/, config.resolveServiceServerConfig(this)];
                    case 3:
                        _b.server = _d.sent();
                        _d.label = 4;
                    case 4:
                        if (!config.resolveSessionConfig) return [3 /*break*/, 6];
                        _c = terminalConfig;
                        return [4 /*yield*/, config.resolveSessionConfig(this)];
                    case 5:
                        _c.session = _d.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        terminalConfig.session = {
                            channel: {
                                type: ServChannel_1.EServChannel.WINDOW,
                            },
                        };
                        _d.label = 7;
                    case 7:
                        if (!config.resolveTerminalConfig) return [3 /*break*/, 9];
                        return [4 /*yield*/, config.resolveTerminalConfig(this, terminalConfig)];
                    case 8:
                        newTerminalConfig = _d.sent();
                        if (newTerminalConfig) {
                            terminalConfig = newTerminalConfig;
                        }
                        _d.label = 9;
                    case 9:
                        // Rewrite type
                        terminalConfig.type = ServTerminal_1.EServTerminal.SLAVE;
                        terminalConfig.session.checkSession = true;
                        // Check config validation
                        if (!terminalConfig.id || !terminalConfig.session) {
                            throw new Error('[SAPPSDK] Invalid terminal config');
                        }
                        // Setup terminal
                        this.terminal = (config.servkit || Servkit_1.servkit).createTerminal(terminalConfig);
                        self = this;
                        SappLifecycleImpl = /** @class */ (function (_super) {
                            __extends(class_1, _super);
                            function class_1() {
                                return _super !== null && _super.apply(this, arguments) || this;
                            }
                            class_1.prototype.onShow = function (p) {
                                return self.onShow(p);
                            };
                            class_1.prototype.onHide = function (p) {
                                return self.onHide(p);
                            };
                            class_1.prototype.onClose = function () {
                                return self.onClose();
                            };
                            return class_1;
                        }(SappLifecycle_1.SappLifecycle));
                        ServService_1.anno.impl()(SappLifecycleImpl);
                        this.terminal.server.addServices([{
                                decl: SappLifecycle_1.SappLifecycle,
                                impl: SappLifecycleImpl,
                            }], {
                            lazy: true,
                        });
                        return [4 /*yield*/, this.terminal.openSession()];
                    case 10:
                        _d.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    SappSDK.prototype.afterInitTerminal = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    SappSDK.prototype.initSDK = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    SappSDK.prototype.onCreate = function (params, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config.onCreate) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.config.onCreate(this, params, data)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    SappSDK.prototype.onShow = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var dontShow;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dontShow = false;
                        if (!this.config.onShow) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.config.onShow(this, params)];
                    case 1:
                        dontShow = _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, dontShow];
                }
            });
        });
    };
    SappSDK.prototype.onHide = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var dontHide;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dontHide = false;
                        if (!this.config.onHide) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.config.onHide(this, params)];
                    case 1:
                        dontHide = _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, dontHide];
                }
            });
        });
    };
    SappSDK.prototype.onClose = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config.onClose) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.config.onClose(this)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    return SappSDK;
}());
exports.SappSDK = SappSDK;
exports.sappSDK = new SappSDK();
//# sourceMappingURL=SappSDK.js.map