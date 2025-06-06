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
import type { PlatformVersionReleaseDate } from './PlatformVersionReleaseDate';
import {
    PlatformVersionReleaseDateFromJSON,
    PlatformVersionReleaseDateFromJSONTyped,
    PlatformVersionReleaseDateToJSON,
    PlatformVersionReleaseDateToJSONTyped,
} from './PlatformVersionReleaseDate';

/**
 * 
 * @export
 * @interface PlatformVersionReleaseDateIdentitiesOrValues
 */
export interface PlatformVersionReleaseDateIdentitiesOrValues {
    /**
     * 
     * @type {Array<number>}
     * @memberof PlatformVersionReleaseDateIdentitiesOrValues
     */
    readonly ids?: Array<number> | null;
    /**
     * 
     * @type {Array<PlatformVersionReleaseDate>}
     * @memberof PlatformVersionReleaseDateIdentitiesOrValues
     */
    readonly values?: Array<PlatformVersionReleaseDate> | null;
}

/**
 * Check if a given object implements the PlatformVersionReleaseDateIdentitiesOrValues interface.
 */
export function instanceOfPlatformVersionReleaseDateIdentitiesOrValues(value: object): value is PlatformVersionReleaseDateIdentitiesOrValues {
    return true;
}

export function PlatformVersionReleaseDateIdentitiesOrValuesFromJSON(json: any): PlatformVersionReleaseDateIdentitiesOrValues {
    return PlatformVersionReleaseDateIdentitiesOrValuesFromJSONTyped(json, false);
}

export function PlatformVersionReleaseDateIdentitiesOrValuesFromJSONTyped(json: any, ignoreDiscriminator: boolean): PlatformVersionReleaseDateIdentitiesOrValues {
    if (json == null) {
        return json;
    }
    return {
        
        'ids': json['ids'] == null ? undefined : json['ids'],
        'values': json['values'] == null ? undefined : ((json['values'] as Array<any>).map(PlatformVersionReleaseDateFromJSON)),
    };
}

export function PlatformVersionReleaseDateIdentitiesOrValuesToJSON(json: any): PlatformVersionReleaseDateIdentitiesOrValues {
    return PlatformVersionReleaseDateIdentitiesOrValuesToJSONTyped(json, false);
}

export function PlatformVersionReleaseDateIdentitiesOrValuesToJSONTyped(value?: Omit<PlatformVersionReleaseDateIdentitiesOrValues, 'ids'|'values'> | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
    };
}

