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

import { mapValues } from '../runtime';
/**
 * 
 * @export
 * @interface CPUInfos
 */
export interface CPUInfos {
    /**
     * 
     * @type {string}
     * @memberof CPUInfos
     */
    name?: string;
    /**
     * 
     * @type {string}
     * @memberof CPUInfos
     */
    maxClockSpeed?: string;
}

/**
 * Check if a given object implements the CPUInfos interface.
 */
export function instanceOfCPUInfos(value: object): value is CPUInfos {
    return true;
}

export function CPUInfosFromJSON(json: any): CPUInfos {
    return CPUInfosFromJSONTyped(json, false);
}

export function CPUInfosFromJSONTyped(json: any, ignoreDiscriminator: boolean): CPUInfos {
    if (json == null) {
        return json;
    }
    return {
        
        'name': json['name'] == null ? undefined : json['name'],
        'maxClockSpeed': json['maxClockSpeed'] == null ? undefined : json['maxClockSpeed'],
    };
}

export function CPUInfosToJSON(json: any): CPUInfos {
    return CPUInfosToJSONTyped(json, false);
}

export function CPUInfosToJSONTyped(value?: CPUInfos | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'name': value['name'],
        'maxClockSpeed': value['maxClockSpeed'],
    };
}

