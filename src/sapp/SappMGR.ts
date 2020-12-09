import { Sapp } from './Sapp';
import { SappController } from './SappController';
import { Servkit, servkit } from '../servkit/Servkit';
import { SappDefaultIFrameController } from './SappDefaultIFrameController';
import { SappShowParams, SappHideParams, SappCloseResult } from './service/m/SappLifecycle';
import { nextUUID } from '../common';

export enum ESappCreatePolicy {
    NONE = 0,
    SINGLETON,  // Default
    INFINITE,
}

export enum ESappLifePolicy {
    NONE = 0,
    AUTO,   // Default
    MANUAL,
}

export enum ESappType {
    IFRAME = 'iframe',
}

export class SappInfo {
    id: string;
    version: string;
    name: string;
    desc?: string;
    type: ESappType;
    url: string;
    options: {
        create?: ESappCreatePolicy;
        life?: ESappLifePolicy;
        lifeMaxHideTime?: number;
        dontStartOnCreate?: boolean;
        layout?: string;
    };
}

export class SappLayoutOptions {
    container?: string | HTMLElement;
    className?: string;
    style?: Partial<HTMLElement['style']>;
    doShow?: ((app: Sapp) => void);
    doHide?: ((app: Sapp) => void);
    showClassName?: string;
    showStyle?: Partial<HTMLElement['style']>;
    hideClassName?: string;
    hideStyle?: Partial<HTMLElement['style']>;
}

export interface SappCreateOptions {
    dontStartOnCreate?: boolean;
    dontReturnExistedApp?: boolean;
    createAppController?(mgr: SappMGR, app: Sapp): SappController;
    layout?: SappLayoutOptions | ((app: Sapp) => SappLayoutOptions);
    startData?: any | ((app: Sapp) => any);
    startShowData?: any | ((app: Sapp) => any);
}

export interface SappMGRConfig {
    servkit?: Servkit;
    createAppController?(mgr: SappMGR, app: Sapp): SappController;
    loadAppInfo?(mgr: SappMGR, id: string): Promise<SappInfo | undefined>;
}

export class SappMGR {
    protected infos: { [key: string]: SappInfo };
    protected apps: { [key: string]: Sapp[] };
    protected nextId: number;
    protected config: SappMGRConfig;

    constructor() {
        this.infos = {};
        this.apps = {};
        this.nextId = Date.now();
        this.setConfig({});
    }

    setConfig(config: SappMGRConfig) {
        this.config = config;

        return this;
    }

    getServkit() {
        return this.config.servkit || servkit;
    }

    getConfig() {
        return this.config;
    }

    getApp(id: string) {
        return this.getApps(id)[0];
    }

    getApps(id: string) {
        return this.apps[id] || [];
    }

    getAppInfo(id: string) {
        return this.infos[id];
    }

    async loadAppInfo(id: string): Promise<SappInfo | undefined> {
        let info: SappInfo | undefined = this.getAppInfo(id);
        if (info) {
            return info;
        }

        if (this.config.loadAppInfo) {
            info = await this.config.loadAppInfo(this, id).catch(() => undefined);
            if (info) {
                this.infos[id] = info;
            }
        }

        return info;
    }

    async create(id: string, options?: SappCreateOptions): Promise<Sapp> {
        options = options || {};

        let app = this.getApp(id);
        if (app) {
            if (!app.info.options.create || app.info.options.create === ESappCreatePolicy.SINGLETON) {
                if (options.dontReturnExistedApp) {
                    throw new Error(`[SAPPMGR] App ${id} is singleton and has created`); 
                } else {
                    return app;
                }
            }
        }

        const info = await this.loadAppInfo(id);
        if (!info) {
            throw new Error(`[SAPPMGR] App ${id} is not exits`);
        }

        app = this.createApp(this.nextAppUuid(info), info, options);

        this.addApp(app);
        app.closed.then(() => {
            this.remApp(app);
        }, () => {
            this.remApp(app);
        });

        app.getController()!.doConfig(options);

        if (!options.dontStartOnCreate && !info.options.dontStartOnCreate) {
            await app.start();
        }

        return app;
    }

    async show(id: string, params?: SappShowParams): Promise<Sapp> {
        const app = this.getApp(id);
        if (!app) {
            return Promise.reject(new Error(`[SAPPMGR] App ${id} has not created`));
        }

        await app.show(params);

        return app;
    }

    async hide(id: string, params?: SappHideParams): Promise<Sapp> {
        const app = this.getApp(id);
        if (!app) {
            return Promise.reject(new Error(`[SAPPMGR] App ${id} has not created`));
        }

        await app.hide(params);

        return app;
    }

    async close(id: string, result?: SappCloseResult): Promise<Sapp> {
        const app = this.getApp(id);
        if (!app) {
            return Promise.reject(new Error(`[SAPPMGR] App ${id} has not created`));
        }

        await app.close(result);

        return app;
    }

    async createOrShow(id: string, options?: SappCreateOptions): Promise<Sapp> {
        const app = this.getApp(id);
        if (app) {
            const params: SappShowParams = {
                force: true,
            };

            if (options && options.startShowData !== undefined) {
                if (typeof options.startShowData === 'function') {
                    params.data = options.startShowData(app);
                } else {
                    params.data = options.startShowData;
                }
            }
            return this.show(id, params);
        } else {
            return this.create(id, options);
        }
    }

    protected addApp(app: Sapp) {
        let apps = this.apps[app.info.id];
        if (!apps) {
            apps = [];
            this.apps[app.info.id] = apps;
        } else {
            if (apps.indexOf(app) >= 0) {
                return false;
            }
        }

        apps.push(app);

        return true;
    }

    protected remApp(app: Sapp) {
        const apps = this.apps[app.info.id];
        if (!apps) {
            return false;
        }

        const i = apps.indexOf(app);
        if (i >= 0) {
            this.apps[app.info.id] = apps.splice(i, 1);
            return true;
        }

        return false;
    }

    protected nextAppUuid(info: SappInfo) {
        return `${info.id}-${nextUUID()}`;
    }

    protected createApp(uuid: string, info: SappInfo, options: SappCreateOptions): Sapp {
        const app = new Sapp(uuid, info, this);
        this.createAppController(app, options);

        return app;
    }

    protected createAppController(app: Sapp, options: SappCreateOptions) {
        if (options.createAppController) {
            return options.createAppController(this, app);
        }

        if (this.config.createAppController) {
            return this.config.createAppController(this, app);
        }

        return this.createDefaultAppController(app);
    }

    protected createDefaultAppController(app: Sapp): SappController {
        return new SappDefaultIFrameController(app);
    }
}

export const sappMGR = new SappMGR();