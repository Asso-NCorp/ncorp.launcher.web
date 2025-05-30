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
 * @interface LanguageSupportType
 */
export interface LanguageSupportType {
    /**
     * 
     * @type {string}
     * @memberof LanguageSupportType
     */
    checksum?: string | null;
    /**
     * 
     * @type {Date}
     * @memberof LanguageSupportType
     */
    createdAt?: Date | null;
    /**
     * 
     * @type {number}
     * @memberof LanguageSupportType
     */
    id?: number | null;
    /**
     * 
     * @type {string}
     * @memberof LanguageSupportType
     */
    name?: string | null;
    /**
     * 
     * @type {Date}
     * @memberof LanguageSupportType
     */
    updatedAt?: Date | null;
}

/**
 * Check if a given object implements the LanguageSupportType interface.
 */
export function instanceOfLanguageSupportType(value: object): value is LanguageSupportType {
    return true;
}

export function LanguageSupportTypeFromJSON(json: any): LanguageSupportType {
    return LanguageSupportTypeFromJSONTyped(json, false);
}

export function LanguageSupportTypeFromJSONTyped(json: any, ignoreDiscriminator: boolean): LanguageSupportType {
    if (json == null) {
        return json;
    }
    return {
        
        'checksum': json['checksum'] == null ? undefined : json['checksum'],
        'createdAt': json['createdAt'] == null ? undefined : (new Date(json['createdAt'])),
        'id': json['id'] == null ? undefined : json['id'],
        'name': json['name'] == null ? undefined : json['name'],
        'updatedAt': json['updatedAt'] == null ? undefined : (new Date(json['updatedAt'])),
    };
}

export function LanguageSupportTypeToJSON(json: any): LanguageSupportType {
    return LanguageSupportTypeToJSONTyped(json, false);
}

export function LanguageSupportTypeToJSONTyped(value?: LanguageSupportType | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'checksum': value['checksum'],
        'createdAt': value['createdAt'] == null ? undefined : ((value['createdAt'] as any).toISOString()),
        'id': value['id'],
        'name': value['name'],
        'updatedAt': value['updatedAt'] == null ? undefined : ((value['updatedAt'] as any).toISOString()),
    };
}

