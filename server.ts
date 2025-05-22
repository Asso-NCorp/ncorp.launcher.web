import { handler } from './handler.js';
import polka from 'polka';
import fs from 'fs';
import https from 'https';
import http from 'http';

const key = fs.readFileSync('./.cert/launcher.n-lan.com.key', 'utf-8');
const cert = fs.readFileSync('./.cert/launcher.n-lan.com.pem', 'utf-8');
const credentials = { key, cert };

// Set NODE_TLS_REJECT_UNAUTHORIZED=0 to ignore self-signed certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const SSLPORT = 5173;

// Créer un serveur HTTPS pour les requêtes sécurisées
const httpsServer = polka()
    .get('/healthcheck', (req, res) => {
        res.end('ok');
    })
    .use(handler);

https.createServer(credentials, httpsServer.handler).listen(SSLPORT, () => {
    console.log('HTTPS Server is running on: https://localhost:%s', SSLPORT);
});
