import { ServTerminal, ServTerminalConfig, EServTerminal } from '../terminal/ServTerminal';
import { ServServiceServerConfig } from '../service/ServServiceServer';
import { parseServQueryParams, asyncThrow } from '../common/index';
import { EServChannel } from '../session/channel/ServChannel';
import { servkit, Servkit } from '../servkit/Servkit';
import { ServService, anno, ServAPIArgs, ServAPIRetn } from '../service/ServService';
import { ServServiceClientConfig } from '../service/ServServiceClient';
import { ServSessionConfig } from '../session/ServSession';
import { SappLifecycle, SappShowParams, SappHideParams } from './service/s/SappLifecycle';
import { SappLifecycle as Lifecycle, SappShowParams as ShowParams, SappHideParams as HideParams } from './service/m/SappLifecycle';
import { Deferred, DeferredUtil } from '../common/Deferred';

/**
 * SappSDK启动参数
 */
export interface SappSDKStartParams {
    uuid?: string;
}

/**
 * SappSDK配置
 */
export interface SappSDKConfig {
    /**
     * SappSDK底层Servkit，默认使用全局的servkit
     */
    servkit?: Servkit;

    /**
     * SappSDK.start() 前置回调
     * @param sdk 
     */
    beforeStart?(sdk: SappSDK): Promise<void>;

    /**
     * SappSDK启动参数的构造回调；
     * 优先使用SappSDKStartOptions.params，其次SappSDKConfig.resolveStartParams，默认使用parseQueryParams；
     * parseQueryParams将会从window.location.href中解析query参数
     * @param sdk 
     */
    resolveStartParams?(sdk: SappSDK): Promise<SappSDKStartParams> | SappSDKStartParams;

    /**
     * ServiceServerConfig的构造回调
     * @param sdk 
     */
    resolveServiceServerConfig?(sdk: SappSDK): Promise<ServServiceServerConfig> | ServServiceServerConfig;
    
    /**
     * ServiceClientConfig的构造回调
     * @param sdk 
     */
    resolveServiceClientConfig?(sdk: SappSDK): Promise<ServServiceClientConfig> | ServServiceClientConfig;

    /**
     * SessionConfig的构造回调
     * @param sdk 
     */
    resolveSessionConfig?(sdk: SappSDK): Promise<ServSessionConfig> | ServSessionConfig;

    /**
     * 在SappSDK中使用ServTerminal作为服务通信的桥接，ServTerminalConfig会通过该回调做最终的config调整
     * @param sdk 
     * @param config 
     */
    resolveTerminalConfig?(sdk: SappSDK, config: ServTerminalConfig)
        : Promise<ServTerminalConfig> | ServTerminalConfig | void;
    
    /**
     * SappSDK.start() 后置回调
     * @param sdk 
     */
    afterStart?(sdk: SappSDK): Promise<void>;

    /**
     * 生命周期回调，应用创建时回调
     *
     * @param {SappSDK} sdk
     * @returns {Promise<void>}
     * @memberof SappSDKConfig
     */
    onCreate?(sdk: SappSDK, params: SappSDKStartParams, data?: any): Promise<void>;

    /**
     * 生命周期回调，应用显示时回调
     *
     * @param {SappSDK} sdk
     * @returns {Promise<void>}
     * @memberof SappSDKConfig
     */
    onShow?(sdk: SappSDK, params: SappShowParams): Promise<boolean>;
    
    /**
     * 生命周期回调，应用隐藏时回调
     *
     * @param {SappSDK} sdk
     * @returns {Promise<void>}
     * @memberof SappSDKConfig
     */
    onHide?(sdk: SappSDK, params: SappHideParams): Promise<boolean>;

    /**
     * 生命周期回调，应用关闭时回调
     *
     * @param {SappSDK} sdk
     * @returns {Promise<void>}
     * @memberof SappSDKConfig
     */
    onClose?(sdk: SappSDK): Promise<void>;
}

/**
 * SappSDK start参数项
 */
export interface SappSDKStartOptions {
    params?: SappSDKStartParams | SappSDKConfig['resolveStartParams'];
}

/**
 * SappSDK是为Servkit应用提供的一个SDK
 */
export class SappSDK {
    /**
     * SDK是否已经初始化
     *
     * @type {boolean}
     * @memberof SappSDK
     */
    isStarted: boolean;

    /**
     * SDK start deffered Promise；在业务层面可以使用sappSDK.started去等待SDK的初始化（也可以直接使用SappSDK.start()这种形式）
     *
     * @type {Deferred}
     * @memberof SappSDK
     */
    started: Deferred;

    /**
     * 内部服务通信桥梁，建议不要直接使用
     *
     * @type {ServTerminal}
     * @memberof SappSDK
     */
    terminal: ServTerminal;

    protected config: SappSDKConfig;

    constructor() {
        this.started = DeferredUtil.create();
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
    setConfig(config: SappSDKConfig) {
        this.config = config;
        return this;
    }

    /**
     * 获取全局配置
     *
     * @returns
     * @memberof SappSDK
     */
    getConfig() {
        return this.config;
    }

    /**
     * 启动SDK
     *
     * @param {SappSDKStartOptions} [options]
     * @returns {Promise<void>}
     * @memberof SappSDK
     */
    start = DeferredUtil.reEntryGuard(async (options?: SappSDKStartOptions): Promise<void> => {
        if (this.isStarted) {
            return;
        }

        const config = this.config;
        if (!config) {
            throw new Error('[SAPPSDK] Config must be set before setup');
        }
        
        try {
            options = options || {};
            
            await this.beforeStart(options);

            const params = await this.resolveStartParams(options);
            
            await this.beforeInitTerminal();
            await this.initTerminal(options, params);
            await this.afterInitTerminal();

            await this.initSDK();

            this.isStarted = true;
            
            await this.afterStart();

            const data = await this.service(Lifecycle).then((service) => {
                return service.getStartData();
            }).catch((error) => {
                asyncThrow(error);
                asyncThrow(new Error('[SAPPSDK] Can\'t get start datas from SAPP'));
            });

            await this.onCreate(params, data);

            this.started.resolve();

            this.service(Lifecycle).then((service) => {
                return service.onStart();
            }).catch((error) => {
                asyncThrow(error);
                asyncThrow(new Error('[SAPPSDK] Can\'t notify onStart to SAPP'));
            });
        } catch (e) {
            this.onStartFailed();

            this.isStarted = false;
            this.started.reject();

            throw e;
        }
    });

    async show(params?: ShowParams) {
        return this.service(Lifecycle).then((service) => {
            return service.show(params);
        });
    }

    async hide(params?: HideParams) {
        return this.service(Lifecycle).then((service) => {
            return service.hide(params);
        });
    }

    async close() {
        return this.service(Lifecycle).then((service) => {
            return service.close();
        });
    }

    /**
     * 销毁SDK，该方法主要用于CI测试（建议业务不要使用，因为SappSDK生命周期通常与应用程序的生命周期保一致）
     */
    destroy() {
        if (!this.isStarted) {
            return;
        }

        this.isStarted = false;
        this.started = DeferredUtil.create();

        if (this.terminal) {
            this.terminal.servkit.destroyTerminal(this.terminal);
            this.terminal = undefined!;
        }
    }

    /**
     * 根据服务声明获取服务对象
     *
     * @template T
     * @param {T} decl
     * @returns {(InstanceType<T> | undefined)}
     * @memberof SappSDK
     */
    getService<T extends typeof ServService>(decl: T): InstanceType<T> | undefined;
    getService<M extends { [key: string]: typeof ServService }>(decls: M)
        : { [key in keyof M]: InstanceType<M[key]> | undefined };
    getService() {
        if (!this.isStarted) {
            return;
        }

        return this.terminal.client.getService(arguments[0]);
    }

    /**
     * 根据服务声明获取服务对象；非安全版本，在类型上任务返回的所有服务对象都是存在的，但实际可能并不存在（值为undefined）
     *
     * @template T
     * @param {T} decl
     * @returns {InstanceType<T>}
     * @memberof SappSDK
     */
    getServiceUnsafe<T extends typeof ServService>(decl: T): InstanceType<T>;
    getServiceUnsafe<M extends { [key: string]: typeof ServService }>(decls: M)
        : { [key in keyof M]: InstanceType<M[key]> };
    getServiceUnsafe() {
        return this.getService.apply(this, arguments);
    }

    /**
     * 根据服务声明获取服务对象，返回一个Promise；如果某个服务不存在，Promise将reject。
     *
     * @template T
     * @param {T} decl
     * @returns {Promise<InstanceType<T>>}
     * @memberof SappSDK
     */
    service<T extends typeof ServService>(decl: T): Promise<InstanceType<T>>;
    service<M extends { [key: string]: typeof ServService }>(decls: M)
        : Promise<{ [key in keyof M]: InstanceType<M[key]> }>;
    service() {
        if (!this.isStarted) {
            return Promise.reject(new Error('[SAPPSDK] SappSDK is not started'));
        }

        return this.terminal.client.service.apply(this.terminal.client, arguments);
    }

    /**
     * 根据服务声明获取服务对象，通过回调方式接收服务对象；如果某个服务不存在，回调得不到调用。
     *
     * @template T
     * @template R
     * @param {T} decl
     * @param {((service: InstanceType<T>) => R)} exec
     * @memberof SappSDK
     */
    serviceExec<
        T extends typeof ServService,
        R>(
        decl: T,
        exec: ((service: InstanceType<T>) => R));
    serviceExec<
        M extends { [key: string]: typeof ServService },
        R>(
        decls: M,
        exec: ((services: { [key in keyof M]: InstanceType<M[key]> }) => R));
    serviceExec() {
        if (!this.isStarted) {
            return null;
        }

        return this.terminal.client.serviceExec.apply(this.terminal.client, arguments);
    }

    protected async beforeStart(options: SappSDKStartOptions): Promise<void> {
        if (this.config.beforeStart) {
            await this.config.beforeStart(this);
        }
    }

    protected async afterStart(): Promise<void> {
        if (this.config.afterStart) {
            await this.config.afterStart(this);
        }
    }

    protected onStartFailed() {
        if (this.terminal) {
            this.terminal.servkit.destroyTerminal(this.terminal);
        }
        this.terminal = undefined!;
    }

    protected async resolveStartParams(options: SappSDKStartOptions): Promise<SappSDKStartParams> {
        let resolveParams: SappSDKConfig['resolveStartParams'] = undefined!;
        if (options.params) {
            resolveParams = 
                typeof options.params === 'function' 
                ? options.params 
                : (() => options.params! as SappSDKStartParams) ;
        } else {
            resolveParams = this.config.resolveStartParams || parseServQueryParams;
        }
        
        const params = await resolveParams(this);
        return params;
    }

    protected async beforeInitTerminal(): Promise<void> {
        //
    }

    protected async initTerminal(options: SappSDKStartOptions, params: SappSDKStartParams): Promise<void> {
        const config = this.config;

        let terminalConfig: ServTerminalConfig = {
            id: params.uuid || '',
            type: EServTerminal.SLAVE,
            session: undefined!,
        };

        if (config.resolveServiceClientConfig) {
            terminalConfig.client = await config.resolveServiceClientConfig(this);
        }

        if (config.resolveServiceServerConfig) {
            terminalConfig.server = await config.resolveServiceServerConfig(this);
        }

        if (config.resolveSessionConfig) {
            terminalConfig.session = await config.resolveSessionConfig(this);
        } else {
            terminalConfig.session = {
                channel: {
                    type: EServChannel.WINDOW,
                },
            };
        }

        if (config.resolveTerminalConfig) {
            const newTerminalConfig = await config.resolveTerminalConfig(this, terminalConfig);
            if (newTerminalConfig) {
                terminalConfig = newTerminalConfig;
            }
        }

        // Rewrite type
        terminalConfig.type = EServTerminal.SLAVE;

        // Check config validation
        if (!terminalConfig.id || !terminalConfig.session) {
            throw new Error('[SAPPSDK] Invalid terminal config');
        }

        // Setup terminal
        this.terminal = (config.servkit || servkit).createTerminal(terminalConfig);

        // Setup lifecycle
        const self = this;
        const SappLifecycleImpl = class extends SappLifecycle {
            onShow(p: ServAPIArgs<SappShowParams>): ServAPIRetn<boolean> {
                return self.onShow(p);
            }
            
            onHide(p: ServAPIArgs<SappHideParams>): ServAPIRetn<boolean> {
                return self.onHide(p);
            }

            onClose(): ServAPIRetn {
                return self.onClose();
            }
        };
        anno.impl()(SappLifecycleImpl);

        this.terminal.server.addServices([{
            decl: SappLifecycle,
            impl: SappLifecycleImpl,
        }], {
            lazy: true,
        });

        await this.terminal.openSession();

        // TODO
        // App validation check
    }

    protected async afterInitTerminal(): Promise<void> {
        //
    }

    protected async initSDK(): Promise<void> {
        // TODO
        // Setup common service in sdk
    }

    protected async onCreate(params: SappSDKStartParams, data: any) {
        if (this.config.onCreate) {
            await this.config.onCreate(this, params, data);
        }
    }

    protected async onShow(params: SappShowParams) {
        let dontShow = false;
        if (this.config.onShow) {
            dontShow = await this.config.onShow(this, params);
        }

        return dontShow;
    }

    protected async onHide(params: SappHideParams) {
        let dontHide = false;
        if (this.config.onHide) {
            dontHide = await this.config.onHide(this, params);
        }
        return dontHide;
    }

    protected async onClose() {
        if (this.config.onClose) {
            await this.config.onClose(this);
        }
    }
}

export const sappSDK = new SappSDK();