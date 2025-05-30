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
import type { Region } from './Region';
import {
    RegionFromJSON,
    RegionFromJSONTyped,
    RegionToJSON,
    RegionToJSONTyped,
} from './Region';

/**
 * 
 * @export
 * @interface RegionIdentityOrValue
 */
export interface RegionIdentityOrValue {
    /**
     * 
     * @type {number}
     * @memberof RegionIdentityOrValue
     */
    readonly id?: number | null;
    /**
     * 
     * @type {Region}
     * @memberof RegionIdentityOrValue
     */
    readonly value?: Region | null;
}

/**
 * Check if a given object implements the RegionIdentityOrValue interface.
 */
export function instanceOfRegionIdentityOrValue(value: object): value is RegionIdentityOrValue {
    return true;
}

export function RegionIdentityOrValueFromJSON(json: any): RegionIdentityOrValue {
    return RegionIdentityOrValueFromJSONTyped(json, false);
}

export function RegionIdentityOrValueFromJSONTyped(json: any, ignoreDiscriminator: boolean): RegionIdentityOrValue {
    if (json == null) {
        return json;
    }
    return {
        
        'id': json['id'] == null ? undefined : json['id'],
        'value': json['value'] == null ? undefined : RegionFromJSON(json['value']),
    };
}

export function RegionIdentityOrValueToJSON(json: any): RegionIdentityOrValue {
    return RegionIdentityOrValueToJSONTyped(json, false);
}

export function RegionIdentityOrValueToJSONTyped(value?: Omit<RegionIdentityOrValue, 'id'|'value'> | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
    };
}

