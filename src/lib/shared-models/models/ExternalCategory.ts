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
export const ExternalCategory = {
    Steam: 'Steam',
    Gog: 'GOG',
    YouTube: 'YouTube',
    Microsoft: 'Microsoft',
    Apple: 'Apple',
    Twitch: 'Twitch',
    Android: 'Android',
    AmazonAsin: 'AmazonAsin',
    AmazonLuna: 'AmazonLuna',
    AmazonAdg: 'AmazonAdg',
    EpicGameStore: 'EpicGameStore',
    Oculus: 'Oculus',
    Utomik: 'Utomik',
    ItchIo: 'ItchIO',
    XboxMarketplace: 'XboxMarketplace',
    Kartridge: 'Kartridge',
    PlaystationStoreUs: 'PlaystationStoreUS',
    FocusEntertainment: 'FocusEntertainment',
    XboxGamePassUltimateCloud: 'XboxGamePassUltimateCloud',
    Gamejolt: 'Gamejolt'
} as const;
export type ExternalCategory = typeof ExternalCategory[keyof typeof ExternalCategory];


export function instanceOfExternalCategory(value: any): boolean {
    for (const key in ExternalCategory) {
        if (Object.prototype.hasOwnProperty.call(ExternalCategory, key)) {
            if (ExternalCategory[key as keyof typeof ExternalCategory] === value) {
                return true;
            }
        }
    }
    return false;
}

export function ExternalCategoryFromJSON(json: any): ExternalCategory {
    return ExternalCategoryFromJSONTyped(json, false);
}

export function ExternalCategoryFromJSONTyped(json: any, ignoreDiscriminator: boolean): ExternalCategory {
    return json as ExternalCategory;
}

export function ExternalCategoryToJSON(value?: ExternalCategory | null): any {
    return value as any;
}

export function ExternalCategoryToJSONTyped(value: any, ignoreDiscriminator: boolean): ExternalCategory {
    return value as ExternalCategory;
}

