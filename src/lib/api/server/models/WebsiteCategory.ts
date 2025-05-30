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


/**
 * 
 * @export
 */
export const WebsiteCategory = {
    Official: 'Official',
    Wikia: 'Wikia',
    Wikipedia: 'Wikipedia',
    Facebook: 'Facebook',
    Twitter: 'Twitter',
    Twitch: 'Twitch',
    Instagram: 'Instagram',
    YouTube: 'YouTube',
    IPhone: 'iPhone',
    IPad: 'iPad',
    Android: 'Android',
    Steam: 'Steam',
    Reddit: 'Reddit',
    Itch: 'Itch',
    EpicGames: 'EpicGames',
    Gog: 'GOG',
    Discord: 'Discord'
} as const;
export type WebsiteCategory = typeof WebsiteCategory[keyof typeof WebsiteCategory];


export function instanceOfWebsiteCategory(value: any): boolean {
    for (const key in WebsiteCategory) {
        if (Object.prototype.hasOwnProperty.call(WebsiteCategory, key)) {
            if (WebsiteCategory[key as keyof typeof WebsiteCategory] === value) {
                return true;
            }
        }
    }
    return false;
}

export function WebsiteCategoryFromJSON(json: any): WebsiteCategory {
    return WebsiteCategoryFromJSONTyped(json, false);
}

export function WebsiteCategoryFromJSONTyped(json: any, ignoreDiscriminator: boolean): WebsiteCategory {
    return json as WebsiteCategory;
}

export function WebsiteCategoryToJSON(value?: WebsiteCategory | null): any {
    return value as any;
}

export function WebsiteCategoryToJSONTyped(value: any, ignoreDiscriminator: boolean): WebsiteCategory {
    return value as WebsiteCategory;
}

