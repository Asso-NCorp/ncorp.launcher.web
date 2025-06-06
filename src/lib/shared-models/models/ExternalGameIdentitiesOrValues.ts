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
import type { ExternalGame } from './ExternalGame';
import {
    ExternalGameFromJSON,
    ExternalGameFromJSONTyped,
    ExternalGameToJSON,
    ExternalGameToJSONTyped,
} from './ExternalGame';

/**
 * 
 * @export
 * @interface ExternalGameIdentitiesOrValues
 */
export interface ExternalGameIdentitiesOrValues {
    /**
     * 
     * @type {Array<number>}
     * @memberof ExternalGameIdentitiesOrValues
     */
    readonly ids?: Array<number> | null;
    /**
     * 
     * @type {Array<ExternalGame>}
     * @memberof ExternalGameIdentitiesOrValues
     */
    readonly values?: Array<ExternalGame> | null;
}

/**
 * Check if a given object implements the ExternalGameIdentitiesOrValues interface.
 */
export function instanceOfExternalGameIdentitiesOrValues(value: object): value is ExternalGameIdentitiesOrValues {
    return true;
}

export function ExternalGameIdentitiesOrValuesFromJSON(json: any): ExternalGameIdentitiesOrValues {
    return ExternalGameIdentitiesOrValuesFromJSONTyped(json, false);
}

export function ExternalGameIdentitiesOrValuesFromJSONTyped(json: any, ignoreDiscriminator: boolean): ExternalGameIdentitiesOrValues {
    if (json == null) {
        return json;
    }
    return {
        
        'ids': json['ids'] == null ? undefined : json['ids'],
        'values': json['values'] == null ? undefined : ((json['values'] as Array<any>).map(ExternalGameFromJSON)),
    };
}

export function ExternalGameIdentitiesOrValuesToJSON(json: any): ExternalGameIdentitiesOrValues {
    return ExternalGameIdentitiesOrValuesToJSONTyped(json, false);
}

export function ExternalGameIdentitiesOrValuesToJSONTyped(value?: Omit<ExternalGameIdentitiesOrValues, 'ids'|'values'> | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
    };
}

