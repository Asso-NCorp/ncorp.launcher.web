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
import type { CollectionTypeIdentityOrValue } from './CollectionTypeIdentityOrValue';
import {
    CollectionTypeIdentityOrValueFromJSON,
    CollectionTypeIdentityOrValueFromJSONTyped,
    CollectionTypeIdentityOrValueToJSON,
    CollectionTypeIdentityOrValueToJSONTyped,
} from './CollectionTypeIdentityOrValue';

/**
 * 
 * @export
 * @interface CollectionRelationType
 */
export interface CollectionRelationType {
    /**
     * 
     * @type {CollectionTypeIdentityOrValue}
     * @memberof CollectionRelationType
     */
    allowedChildType?: CollectionTypeIdentityOrValue | null;
    /**
     * 
     * @type {CollectionTypeIdentityOrValue}
     * @memberof CollectionRelationType
     */
    allowedParentType?: CollectionTypeIdentityOrValue | null;
    /**
     * 
     * @type {string}
     * @memberof CollectionRelationType
     */
    checksum?: string | null;
    /**
     * 
     * @type {Date}
     * @memberof CollectionRelationType
     */
    createdAt?: Date | null;
    /**
     * 
     * @type {string}
     * @memberof CollectionRelationType
     */
    description?: string | null;
    /**
     * 
     * @type {number}
     * @memberof CollectionRelationType
     */
    id?: number | null;
    /**
     * 
     * @type {string}
     * @memberof CollectionRelationType
     */
    name?: string | null;
    /**
     * 
     * @type {Date}
     * @memberof CollectionRelationType
     */
    updatedAt?: Date | null;
}

/**
 * Check if a given object implements the CollectionRelationType interface.
 */
export function instanceOfCollectionRelationType(value: object): value is CollectionRelationType {
    return true;
}

export function CollectionRelationTypeFromJSON(json: any): CollectionRelationType {
    return CollectionRelationTypeFromJSONTyped(json, false);
}

export function CollectionRelationTypeFromJSONTyped(json: any, ignoreDiscriminator: boolean): CollectionRelationType {
    if (json == null) {
        return json;
    }
    return {
        
        'allowedChildType': json['allowedChildType'] == null ? undefined : CollectionTypeIdentityOrValueFromJSON(json['allowedChildType']),
        'allowedParentType': json['allowedParentType'] == null ? undefined : CollectionTypeIdentityOrValueFromJSON(json['allowedParentType']),
        'checksum': json['checksum'] == null ? undefined : json['checksum'],
        'createdAt': json['createdAt'] == null ? undefined : (new Date(json['createdAt'])),
        'description': json['description'] == null ? undefined : json['description'],
        'id': json['id'] == null ? undefined : json['id'],
        'name': json['name'] == null ? undefined : json['name'],
        'updatedAt': json['updatedAt'] == null ? undefined : (new Date(json['updatedAt'])),
    };
}

export function CollectionRelationTypeToJSON(json: any): CollectionRelationType {
    return CollectionRelationTypeToJSONTyped(json, false);
}

export function CollectionRelationTypeToJSONTyped(value?: CollectionRelationType | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'allowedChildType': CollectionTypeIdentityOrValueToJSON(value['allowedChildType']),
        'allowedParentType': CollectionTypeIdentityOrValueToJSON(value['allowedParentType']),
        'checksum': value['checksum'],
        'createdAt': value['createdAt'] == null ? undefined : ((value['createdAt'] as any).toISOString()),
        'description': value['description'],
        'id': value['id'],
        'name': value['name'],
        'updatedAt': value['updatedAt'] == null ? undefined : ((value['updatedAt'] as any).toISOString()),
    };
}

