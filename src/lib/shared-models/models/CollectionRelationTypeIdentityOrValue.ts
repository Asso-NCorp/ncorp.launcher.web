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
import type { CollectionRelationType } from './CollectionRelationType';
import {
    CollectionRelationTypeFromJSON,
    CollectionRelationTypeFromJSONTyped,
    CollectionRelationTypeToJSON,
    CollectionRelationTypeToJSONTyped,
} from './CollectionRelationType';

/**
 * 
 * @export
 * @interface CollectionRelationTypeIdentityOrValue
 */
export interface CollectionRelationTypeIdentityOrValue {
    /**
     * 
     * @type {number}
     * @memberof CollectionRelationTypeIdentityOrValue
     */
    readonly id?: number | null;
    /**
     * 
     * @type {CollectionRelationType}
     * @memberof CollectionRelationTypeIdentityOrValue
     */
    readonly value?: CollectionRelationType | null;
}

/**
 * Check if a given object implements the CollectionRelationTypeIdentityOrValue interface.
 */
export function instanceOfCollectionRelationTypeIdentityOrValue(value: object): value is CollectionRelationTypeIdentityOrValue {
    return true;
}

export function CollectionRelationTypeIdentityOrValueFromJSON(json: any): CollectionRelationTypeIdentityOrValue {
    return CollectionRelationTypeIdentityOrValueFromJSONTyped(json, false);
}

export function CollectionRelationTypeIdentityOrValueFromJSONTyped(json: any, ignoreDiscriminator: boolean): CollectionRelationTypeIdentityOrValue {
    if (json == null) {
        return json;
    }
    return {
        
        'id': json['id'] == null ? undefined : json['id'],
        'value': json['value'] == null ? undefined : CollectionRelationTypeFromJSON(json['value']),
    };
}

export function CollectionRelationTypeIdentityOrValueToJSON(json: any): CollectionRelationTypeIdentityOrValue {
    return CollectionRelationTypeIdentityOrValueToJSONTyped(json, false);
}

export function CollectionRelationTypeIdentityOrValueToJSONTyped(value?: Omit<CollectionRelationTypeIdentityOrValue, 'id'|'value'> | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
    };
}

