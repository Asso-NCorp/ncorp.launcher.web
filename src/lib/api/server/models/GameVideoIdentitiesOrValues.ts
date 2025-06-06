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
import type { GameVideo } from './GameVideo';
import {
    GameVideoFromJSON,
    GameVideoFromJSONTyped,
    GameVideoToJSON,
    GameVideoToJSONTyped,
} from './GameVideo';

/**
 * 
 * @export
 * @interface GameVideoIdentitiesOrValues
 */
export interface GameVideoIdentitiesOrValues {
    /**
     * 
     * @type {Array<number>}
     * @memberof GameVideoIdentitiesOrValues
     */
    readonly ids?: Array<number> | null;
    /**
     * 
     * @type {Array<GameVideo>}
     * @memberof GameVideoIdentitiesOrValues
     */
    readonly values?: Array<GameVideo> | null;
}

/**
 * Check if a given object implements the GameVideoIdentitiesOrValues interface.
 */
export function instanceOfGameVideoIdentitiesOrValues(value: object): value is GameVideoIdentitiesOrValues {
    return true;
}

export function GameVideoIdentitiesOrValuesFromJSON(json: any): GameVideoIdentitiesOrValues {
    return GameVideoIdentitiesOrValuesFromJSONTyped(json, false);
}

export function GameVideoIdentitiesOrValuesFromJSONTyped(json: any, ignoreDiscriminator: boolean): GameVideoIdentitiesOrValues {
    if (json == null) {
        return json;
    }
    return {
        
        'ids': json['ids'] == null ? undefined : json['ids'],
        'values': json['values'] == null ? undefined : ((json['values'] as Array<any>).map(GameVideoFromJSON)),
    };
}

export function GameVideoIdentitiesOrValuesToJSON(json: any): GameVideoIdentitiesOrValues {
    return GameVideoIdentitiesOrValuesToJSONTyped(json, false);
}

export function GameVideoIdentitiesOrValuesToJSONTyped(value?: Omit<GameVideoIdentitiesOrValues, 'ids'|'values'> | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
    };
}

