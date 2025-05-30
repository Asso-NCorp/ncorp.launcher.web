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
import type { AgeRating } from './AgeRating';
import {
    AgeRatingFromJSON,
    AgeRatingFromJSONTyped,
    AgeRatingToJSON,
    AgeRatingToJSONTyped,
} from './AgeRating';

/**
 * 
 * @export
 * @interface AgeRatingIdentitiesOrValues
 */
export interface AgeRatingIdentitiesOrValues {
    /**
     * 
     * @type {Array<number>}
     * @memberof AgeRatingIdentitiesOrValues
     */
    readonly ids?: Array<number> | null;
    /**
     * 
     * @type {Array<AgeRating>}
     * @memberof AgeRatingIdentitiesOrValues
     */
    readonly values?: Array<AgeRating> | null;
}

/**
 * Check if a given object implements the AgeRatingIdentitiesOrValues interface.
 */
export function instanceOfAgeRatingIdentitiesOrValues(value: object): value is AgeRatingIdentitiesOrValues {
    return true;
}

export function AgeRatingIdentitiesOrValuesFromJSON(json: any): AgeRatingIdentitiesOrValues {
    return AgeRatingIdentitiesOrValuesFromJSONTyped(json, false);
}

export function AgeRatingIdentitiesOrValuesFromJSONTyped(json: any, ignoreDiscriminator: boolean): AgeRatingIdentitiesOrValues {
    if (json == null) {
        return json;
    }
    return {
        
        'ids': json['ids'] == null ? undefined : json['ids'],
        'values': json['values'] == null ? undefined : ((json['values'] as Array<any>).map(AgeRatingFromJSON)),
    };
}

export function AgeRatingIdentitiesOrValuesToJSON(json: any): AgeRatingIdentitiesOrValues {
    return AgeRatingIdentitiesOrValuesToJSONTyped(json, false);
}

export function AgeRatingIdentitiesOrValuesToJSONTyped(value?: Omit<AgeRatingIdentitiesOrValues, 'ids'|'values'> | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
    };
}

