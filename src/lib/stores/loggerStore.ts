import { browser } from '$app/environment';

import pino, { type LoggerOptions } from 'pino';
import { get, readable, type Readable } from 'svelte/store';
import { type PinoLogger } from '../interfaces';


// Default log level will be set to silent but will be modified as per the environment in context.
const getLogLevel = (NODE_ENV: string) => {
    let logLevel = 'silent';
    switch (NODE_ENV) {
        case "development":
        case "preview":
            logLevel = 'debug'; // for Development and Preview envs, use debug log level
            break;
        case "staging":
            logLevel = 'info'; // info for Staging
            break;
        case "production":
            if (browser) {
                logLevel = 'silent'; // for Production, silent in browser
            } else {
                logLevel = 'info'; // and info in server
            }
            break;
    }

    console.log('Log level set to:', logLevel);
    return logLevel;
}

// This is an IIFE, self executing funtion. It will return the Pino Logger instance 
const plogger: PinoLogger = (() => {
    let pinoOptions: LoggerOptions;

    if (browser) {
        // If logger is running in browser, pretty print it.
        pinoOptions = {
            browser: { asObject: false },
            // format the level in the log to be uppercase.
            formatters: {
                level: label => {
                    return { level: label.toUpperCase() };
                },
            },
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true, // show colors in log
                    levelFirst: true, // show levels first in log
                    translateTime: true, // translate the time in human readable format
                },
            },
        }
    } else {
        // If logger is running in the server, do not pretty print it.
        pinoOptions = {
            formatters: {
                level: label => {
                    return { level: label.toUpperCase() };
                },
            },
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true, // show colors in log
                    levelFirst: true, // show levels first in log
                    translateTime: true, // translate the time in human readable format
                },
            }
        };
    }

    pinoOptions.level = getLogLevel(import.meta.env.MODE);

    return pino(pinoOptions);
})();




// Create a Readable store for the logger as it value is never going to change.
const pinoLogger: Readable<PinoLogger> = readable<PinoLogger>(plogger);


// Exporting the logger value obtained by get() function as to always import the logger file from lib folder.
export const logger = get(pinoLogger);