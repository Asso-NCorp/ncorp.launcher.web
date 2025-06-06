/* tslint:disable */
/* eslint-disable */
/**
 * NCorp.Server
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { mapValues } from '../runtime';
/**
 * 
 * @export
 * @interface AddGameModel
 */
export interface AddGameModel {
    /**
     * 
     * @type {string}
     * @memberof AddGameModel
     */
    title?: string;
    /**
     * 
     * @type {string}
     * @memberof AddGameModel
     */
    folderSlug?: string;
    /**
     * 
     * @type {Array<string>}
     * @memberof AddGameModel
     */
    genres?: Array<string>;
    /**
     * 
     * @type {string}
     * @memberof AddGameModel
     */
    mainProcessName?: string | null;
    /**
     * 
     * @type {{ [key: string]: string; }}
     * @memberof AddGameModel
     */
    cover?: { [key: string]: string; };
    /**
     * 
     * @type {{ [key: string]: string; }}
     * @memberof AddGameModel
     */
    screenshots?: { [key: string]: string; };
    /**
     * 
     * @type {string}
     * @memberof AddGameModel
     */
    description?: string;
    /**
     * 
     * @type {string}
     * @memberof AddGameModel
     */
    startCommand?: string;
    /**
     * 
     * @type {number}
     * @memberof AddGameModel
     */
    maxPlayers?: number;
    /**
     * 
     * @type {boolean}
     * @memberof AddGameModel
     */
    isInstalled?: boolean;
    /**
     * 
     * @type {number}
     * @memberof AddGameModel
     */
    size?: number;
    /**
     * 
     * @type {boolean}
     * @memberof AddGameModel
     */
    useNotifications?: boolean;
}

/**
 * Check if a given object implements the AddGameModel interface.
 */
export function instanceOfAddGameModel(value: object): value is AddGameModel {
    return true;
}

export function AddGameModelFromJSON(json: any): AddGameModel {
    return AddGameModelFromJSONTyped(json, false);
}

export function AddGameModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): AddGameModel {
    if (json == null) {
        return json;
    }
    return {
        
        'title': json['title'] == null ? undefined : json['title'],
        'folderSlug': json['folderSlug'] == null ? undefined : json['folderSlug'],
        'genres': json['genres'] == null ? undefined : json['genres'],
        'mainProcessName': json['mainProcessName'] == null ? undefined : json['mainProcessName'],
        'cover': json['cover'] == null ? undefined : json['cover'],
        'screenshots': json['screenshots'] == null ? undefined : json['screenshots'],
        'description': json['description'] == null ? undefined : json['description'],
        'startCommand': json['startCommand'] == null ? undefined : json['startCommand'],
        'maxPlayers': json['maxPlayers'] == null ? undefined : json['maxPlayers'],
        'isInstalled': json['isInstalled'] == null ? undefined : json['isInstalled'],
        'size': json['size'] == null ? undefined : json['size'],
        'useNotifications': json['useNotifications'] == null ? undefined : json['useNotifications'],
    };
}

export function AddGameModelToJSON(json: any): AddGameModel {
    return AddGameModelToJSONTyped(json, false);
}

export function AddGameModelToJSONTyped(value?: AddGameModel | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'title': value['title'],
        'folderSlug': value['folderSlug'],
        'genres': value['genres'],
        'mainProcessName': value['mainProcessName'],
        'cover': value['cover'],
        'screenshots': value['screenshots'],
        'description': value['description'],
        'startCommand': value['startCommand'],
        'maxPlayers': value['maxPlayers'],
        'isInstalled': value['isInstalled'],
        'size': value['size'],
        'useNotifications': value['useNotifications'],
    };
}

