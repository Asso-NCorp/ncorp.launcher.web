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
import type { GameIdentitiesOrValues } from './GameIdentitiesOrValues';
import {
    GameIdentitiesOrValuesFromJSON,
    GameIdentitiesOrValuesFromJSONTyped,
    GameIdentitiesOrValuesToJSON,
    GameIdentitiesOrValuesToJSONTyped,
} from './GameIdentitiesOrValues';

/**
 * 
 * @export
 * @interface Franchise
 */
export interface Franchise {
    /**
     * 
     * @type {Date}
     * @memberof Franchise
     */
    createdAt?: Date | null;
    /**
     * 
     * @type {string}
     * @memberof Franchise
     */
    checksum?: string | null;
    /**
     * 
     * @type {Date}
     * @memberof Franchise
     */
    updatedAt?: Date | null;
    /**
     * 
     * @type {number}
     * @memberof Franchise
     */
    id?: number | null;
    /**
     * 
     * @type {GameIdentitiesOrValues}
     * @memberof Franchise
     */
    games?: GameIdentitiesOrValues | null;
    /**
     * 
     * @type {string}
     * @memberof Franchise
     */
    name?: string | null;
    /**
     * 
     * @type {string}
     * @memberof Franchise
     */
    slug?: string | null;
    /**
     * 
     * @type {string}
     * @memberof Franchise
     */
    url?: string | null;
}

/**
 * Check if a given object implements the Franchise interface.
 */
export function instanceOfFranchise(value: object): value is Franchise {
    return true;
}

export function FranchiseFromJSON(json: any): Franchise {
    return FranchiseFromJSONTyped(json, false);
}

export function FranchiseFromJSONTyped(json: any, ignoreDiscriminator: boolean): Franchise {
    if (json == null) {
        return json;
    }
    return {
        
        'createdAt': json['createdAt'] == null ? undefined : (new Date(json['createdAt'])),
        'checksum': json['checksum'] == null ? undefined : json['checksum'],
        'updatedAt': json['updatedAt'] == null ? undefined : (new Date(json['updatedAt'])),
        'id': json['id'] == null ? undefined : json['id'],
        'games': json['games'] == null ? undefined : GameIdentitiesOrValuesFromJSON(json['games']),
        'name': json['name'] == null ? undefined : json['name'],
        'slug': json['slug'] == null ? undefined : json['slug'],
        'url': json['url'] == null ? undefined : json['url'],
    };
}

export function FranchiseToJSON(json: any): Franchise {
    return FranchiseToJSONTyped(json, false);
}

export function FranchiseToJSONTyped(value?: Franchise | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'createdAt': value['createdAt'] == null ? undefined : ((value['createdAt'] as any).toISOString()),
        'checksum': value['checksum'],
        'updatedAt': value['updatedAt'] == null ? undefined : ((value['updatedAt'] as any).toISOString()),
        'id': value['id'],
        'games': GameIdentitiesOrValuesToJSON(value['games']),
        'name': value['name'],
        'slug': value['slug'],
        'url': value['url'],
    };
}

