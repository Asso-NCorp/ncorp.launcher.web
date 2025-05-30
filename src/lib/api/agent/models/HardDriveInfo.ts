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
 * @interface HardDriveInfo
 */
export interface HardDriveInfo {
    /**
     * 
     * @type {string}
     * @memberof HardDriveInfo
     */
    letter?: string;
    /**
     * 
     * @type {string}
     * @memberof HardDriveInfo
     */
    name?: string;
    /**
     * 
     * @type {string}
     * @memberof HardDriveInfo
     */
    format?: string;
    /**
     * 
     * @type {number}
     * @memberof HardDriveInfo
     */
    totalSpace?: number;
    /**
     * 
     * @type {number}
     * @memberof HardDriveInfo
     */
    freeSpace?: number;
    /**
     * 
     * @type {number}
     * @memberof HardDriveInfo
     */
    usedSpace?: number;
    /**
     * 
     * @type {number}
     * @memberof HardDriveInfo
     */
    readonly usedSpacePercent?: number;
}

/**
 * Check if a given object implements the HardDriveInfo interface.
 */
export function instanceOfHardDriveInfo(value: object): value is HardDriveInfo {
    return true;
}

export function HardDriveInfoFromJSON(json: any): HardDriveInfo {
    return HardDriveInfoFromJSONTyped(json, false);
}

export function HardDriveInfoFromJSONTyped(json: any, ignoreDiscriminator: boolean): HardDriveInfo {
    if (json == null) {
        return json;
    }
    return {
        
        'letter': json['letter'] == null ? undefined : json['letter'],
        'name': json['name'] == null ? undefined : json['name'],
        'format': json['format'] == null ? undefined : json['format'],
        'totalSpace': json['totalSpace'] == null ? undefined : json['totalSpace'],
        'freeSpace': json['freeSpace'] == null ? undefined : json['freeSpace'],
        'usedSpace': json['usedSpace'] == null ? undefined : json['usedSpace'],
        'usedSpacePercent': json['usedSpacePercent'] == null ? undefined : json['usedSpacePercent'],
    };
}

export function HardDriveInfoToJSON(json: any): HardDriveInfo {
    return HardDriveInfoToJSONTyped(json, false);
}

export function HardDriveInfoToJSONTyped(value?: Omit<HardDriveInfo, 'usedSpacePercent'> | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'letter': value['letter'],
        'name': value['name'],
        'format': value['format'],
        'totalSpace': value['totalSpace'],
        'freeSpace': value['freeSpace'],
        'usedSpace': value['usedSpace'],
    };
}

