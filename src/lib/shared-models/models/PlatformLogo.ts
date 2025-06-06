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
 * @interface PlatformLogo
 */
export interface PlatformLogo {
    /**
     * 
     * @type {boolean}
     * @memberof PlatformLogo
     */
    alphaChannel?: boolean | null;
    /**
     * 
     * @type {boolean}
     * @memberof PlatformLogo
     */
    animated?: boolean | null;
    /**
     * 
     * @type {string}
     * @memberof PlatformLogo
     */
    checksum?: string | null;
    /**
     * 
     * @type {number}
     * @memberof PlatformLogo
     */
    height?: number | null;
    /**
     * 
     * @type {number}
     * @memberof PlatformLogo
     */
    id?: number | null;
    /**
     * 
     * @type {string}
     * @memberof PlatformLogo
     */
    imageId?: string | null;
    /**
     * 
     * @type {string}
     * @memberof PlatformLogo
     */
    url?: string | null;
    /**
     * 
     * @type {number}
     * @memberof PlatformLogo
     */
    width?: number | null;
}

/**
 * Check if a given object implements the PlatformLogo interface.
 */
export function instanceOfPlatformLogo(value: object): value is PlatformLogo {
    return true;
}

export function PlatformLogoFromJSON(json: any): PlatformLogo {
    return PlatformLogoFromJSONTyped(json, false);
}

export function PlatformLogoFromJSONTyped(json: any, ignoreDiscriminator: boolean): PlatformLogo {
    if (json == null) {
        return json;
    }
    return {
        
        'alphaChannel': json['alphaChannel'] == null ? undefined : json['alphaChannel'],
        'animated': json['animated'] == null ? undefined : json['animated'],
        'checksum': json['checksum'] == null ? undefined : json['checksum'],
        'height': json['height'] == null ? undefined : json['height'],
        'id': json['id'] == null ? undefined : json['id'],
        'imageId': json['imageId'] == null ? undefined : json['imageId'],
        'url': json['url'] == null ? undefined : json['url'],
        'width': json['width'] == null ? undefined : json['width'],
    };
}

export function PlatformLogoToJSON(json: any): PlatformLogo {
    return PlatformLogoToJSONTyped(json, false);
}

export function PlatformLogoToJSONTyped(value?: PlatformLogo | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'alphaChannel': value['alphaChannel'],
        'animated': value['animated'],
        'checksum': value['checksum'],
        'height': value['height'],
        'id': value['id'],
        'imageId': value['imageId'],
        'url': value['url'],
        'width': value['width'],
    };
}

