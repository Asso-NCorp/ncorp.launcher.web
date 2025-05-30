/* tslint:disable */
/* eslint-disable */
/**
 * NCorp.Agent.App
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


import * as runtime from '../runtime';
import type {
  FolderInfo,
  InstallableGame,
  TR,
} from '../models/index';
import {
    FolderInfoFromJSON,
    FolderInfoToJSON,
    InstallableGameFromJSON,
    InstallableGameToJSON,
    TRFromJSON,
    TRToJSON,
} from '../models/index';

export interface AuthenticateRequest {
    redirect?: boolean;
}

export interface CancelInstallationRequest {
    gameSlug?: string;
}

export interface DeleteGameRequest {
    gameSlug?: string;
}

export interface GetFoldersRequest {
    path?: string;
}

export interface InstallRequest {
    installableGame?: Omit<InstallableGame, 'genresStr'>;
}

export interface OpenGameFolderRequest {
    gameSlug?: string;
}

export interface SaveLocalGamesDirRequest {
    localDir?: string;
}

export interface SetLocalGamesDirRequest {
    dir?: string;
}

export interface SetUsernameRequest {
    gameSlug?: string;
}

export interface StartGameRequest {
    gameSlug?: string;
}

export interface StopGameRequest {
    slug?: string;
}

/**
 * 
 */
export class LocalApi extends runtime.BaseAPI {

    /**
     */
    async authenticateRaw(requestParameters: AuthenticateRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>> {
        const queryParameters: any = {};

        if (requestParameters['redirect'] != null) {
            queryParameters['redirect'] = requestParameters['redirect'];
        }

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("Bearer", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }
        const response = await this.request({
            path: `/api/Local/Authenticate`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.VoidApiResponse(response);
    }

    /**
     */
    async authenticate(requestParameters: AuthenticateRequest = {}, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void> {
        await this.authenticateRaw(requestParameters, initOverrides);
    }

    /**
     */
    async cancelInstallationRaw(requestParameters: CancelInstallationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>> {
        const queryParameters: any = {};

        if (requestParameters['gameSlug'] != null) {
            queryParameters['gameSlug'] = requestParameters['gameSlug'];
        }

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("Bearer", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }
        const response = await this.request({
            path: `/api/Local/CancelInstallation`,
            method: 'DELETE',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.VoidApiResponse(response);
    }

    /**
     */
    async cancelInstallation(requestParameters: CancelInstallationRequest = {}, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void> {
        await this.cancelInstallationRaw(requestParameters, initOverrides);
    }

    /**
     */
    async deleteGameRaw(requestParameters: DeleteGameRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>> {
        const queryParameters: any = {};

        if (requestParameters['gameSlug'] != null) {
            queryParameters['gameSlug'] = requestParameters['gameSlug'];
        }

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("Bearer", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }
        const response = await this.request({
            path: `/api/Local/DeleteGame`,
            method: 'DELETE',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.VoidApiResponse(response);
    }

    /**
     */
    async deleteGame(requestParameters: DeleteGameRequest = {}, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void> {
        await this.deleteGameRaw(requestParameters, initOverrides);
    }

    /**
     */
    async getFoldersRaw(requestParameters: GetFoldersRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<Array<FolderInfo>>> {
        const queryParameters: any = {};

        if (requestParameters['path'] != null) {
            queryParameters['path'] = requestParameters['path'];
        }

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("Bearer", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }
        const response = await this.request({
            path: `/api/Local/GetFolders`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => jsonValue.map(FolderInfoFromJSON));
    }

    /**
     */
    async getFolders(requestParameters: GetFoldersRequest = {}, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<Array<FolderInfo>> {
        const response = await this.getFoldersRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     */
    async getInstalledGamesRaw(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<Array<InstallableGame>>> {
        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("Bearer", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }
        const response = await this.request({
            path: `/api/Local/InstalledGames`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => jsonValue.map(InstallableGameFromJSON));
    }

    /**
     */
    async getInstalledGames(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<Array<InstallableGame>> {
        const response = await this.getInstalledGamesRaw(initOverrides);
        return await response.value();
    }

    /**
     */
    async getLocalGamesDirRaw(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<string>> {
        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("Bearer", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }
        const response = await this.request({
            path: `/api/Local/GetLocalGamesDir`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        if (this.isJsonMime(response.headers.get('content-type'))) {
            return new runtime.JSONApiResponse<string>(response);
        } else {
            return new runtime.TextApiResponse(response) as any;
        }
    }

    /**
     */
    async getLocalGamesDir(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<string> {
        const response = await this.getLocalGamesDirRaw(initOverrides);
        return await response.value();
    }

    /**
     */
    async installRaw(requestParameters: InstallRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<TR>> {
        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("Bearer", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }
        const response = await this.request({
            path: `/api/Local/Install`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: InstallableGameToJSON(requestParameters['installableGame']),
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => TRFromJSON(jsonValue));
    }

    /**
     */
    async install(requestParameters: InstallRequest = {}, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<TR> {
        const response = await this.installRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     */
    async listPlayingGamesRaw(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<Array<object>>> {
        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("Bearer", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }
        const response = await this.request({
            path: `/api/Local/ListPlayingGames`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse<any>(response);
    }

    /**
     */
    async listPlayingGames(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<Array<object>> {
        const response = await this.listPlayingGamesRaw(initOverrides);
        return await response.value();
    }

    /**
     */
    async openGameFolderRaw(requestParameters: OpenGameFolderRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>> {
        const queryParameters: any = {};

        if (requestParameters['gameSlug'] != null) {
            queryParameters['gameSlug'] = requestParameters['gameSlug'];
        }

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("Bearer", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }
        const response = await this.request({
            path: `/api/Local/OpenGameFolder`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.VoidApiResponse(response);
    }

    /**
     */
    async openGameFolder(requestParameters: OpenGameFolderRequest = {}, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void> {
        await this.openGameFolderRaw(requestParameters, initOverrides);
    }

    /**
     */
    async saveLocalGamesDirRaw(requestParameters: SaveLocalGamesDirRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<boolean>> {
        const queryParameters: any = {};

        if (requestParameters['localDir'] != null) {
            queryParameters['localDir'] = requestParameters['localDir'];
        }

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("Bearer", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }
        const response = await this.request({
            path: `/api/Local/SaveLocalGamesDir`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        if (this.isJsonMime(response.headers.get('content-type'))) {
            return new runtime.JSONApiResponse<boolean>(response);
        } else {
            return new runtime.TextApiResponse(response) as any;
        }
    }

    /**
     */
    async saveLocalGamesDir(requestParameters: SaveLocalGamesDirRequest = {}, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<boolean> {
        const response = await this.saveLocalGamesDirRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     */
    async setLocalGamesDirRaw(requestParameters: SetLocalGamesDirRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>> {
        const queryParameters: any = {};

        if (requestParameters['dir'] != null) {
            queryParameters['dir'] = requestParameters['dir'];
        }

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("Bearer", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }
        const response = await this.request({
            path: `/api/Local/SetLocalGamesDir`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.VoidApiResponse(response);
    }

    /**
     */
    async setLocalGamesDir(requestParameters: SetLocalGamesDirRequest = {}, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void> {
        await this.setLocalGamesDirRaw(requestParameters, initOverrides);
    }

    /**
     */
    async setUsernameRaw(requestParameters: SetUsernameRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>> {
        const queryParameters: any = {};

        if (requestParameters['gameSlug'] != null) {
            queryParameters['gameSlug'] = requestParameters['gameSlug'];
        }

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("Bearer", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }
        const response = await this.request({
            path: `/api/Local/SetUsername`,
            method: 'PATCH',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.VoidApiResponse(response);
    }

    /**
     */
    async setUsername(requestParameters: SetUsernameRequest = {}, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void> {
        await this.setUsernameRaw(requestParameters, initOverrides);
    }

    /**
     */
    async startGameRaw(requestParameters: StartGameRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>> {
        const queryParameters: any = {};

        if (requestParameters['gameSlug'] != null) {
            queryParameters['gameSlug'] = requestParameters['gameSlug'];
        }

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("Bearer", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }
        const response = await this.request({
            path: `/api/Local/StartGame`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.VoidApiResponse(response);
    }

    /**
     */
    async startGame(requestParameters: StartGameRequest = {}, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void> {
        await this.startGameRaw(requestParameters, initOverrides);
    }

    /**
     */
    async stopGameRaw(requestParameters: StopGameRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>> {
        const queryParameters: any = {};

        if (requestParameters['slug'] != null) {
            queryParameters['slug'] = requestParameters['slug'];
        }

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("Bearer", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }
        const response = await this.request({
            path: `/api/Local/StopGame`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.VoidApiResponse(response);
    }

    /**
     */
    async stopGame(requestParameters: StopGameRequest = {}, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void> {
        await this.stopGameRaw(requestParameters, initOverrides);
    }

    /**
     */
    async syncPlayingGamesRaw(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>> {
        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("Bearer", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }
        const response = await this.request({
            path: `/api/Local/SyncPlayingGames`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.VoidApiResponse(response);
    }

    /**
     */
    async syncPlayingGames(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void> {
        await this.syncPlayingGamesRaw(initOverrides);
    }

}
