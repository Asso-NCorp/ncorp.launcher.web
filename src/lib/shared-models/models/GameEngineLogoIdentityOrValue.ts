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
import type { GameEngineLogo } from './GameEngineLogo';
import {
    GameEngineLogoFromJSON,
    GameEngineLogoFromJSONTyped,
    GameEngineLogoToJSON,
    GameEngineLogoToJSONTyped,
} from './GameEngineLogo';

/**
 * 
 * @export
 * @interface GameEngineLogoIdentityOrValue
 */
export interface GameEngineLogoIdentityOrValue {
    /**
     * 
     * @type {number}
     * @memberof GameEngineLogoIdentityOrValue
     */
    readonly id?: number | null;
    /**
     * 
     * @type {GameEngineLogo}
     * @memberof GameEngineLogoIdentityOrValue
     */
    readonly value?: GameEngineLogo | null;
}

/**
 * Check if a given object implements the GameEngineLogoIdentityOrValue interface.
 */
export function instanceOfGameEngineLogoIdentityOrValue(value: object): value is GameEngineLogoIdentityOrValue {
    return true;
}

export function GameEngineLogoIdentityOrValueFromJSON(json: any): GameEngineLogoIdentityOrValue {
    return GameEngineLogoIdentityOrValueFromJSONTyped(json, false);
}

export function GameEngineLogoIdentityOrValueFromJSONTyped(json: any, ignoreDiscriminator: boolean): GameEngineLogoIdentityOrValue {
    if (json == null) {
        return json;
    }
    return {
        
        'id': json['id'] == null ? undefined : json['id'],
        'value': json['value'] == null ? undefined : GameEngineLogoFromJSON(json['value']),
    };
}

export function GameEngineLogoIdentityOrValueToJSON(json: any): GameEngineLogoIdentityOrValue {
    return GameEngineLogoIdentityOrValueToJSONTyped(json, false);
}

export function GameEngineLogoIdentityOrValueToJSONTyped(value?: Omit<GameEngineLogoIdentityOrValue, 'id'|'value'> | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
    };
}

