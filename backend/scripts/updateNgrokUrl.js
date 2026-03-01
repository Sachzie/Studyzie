const http = require('http');
const fs = require('fs');
const path = require('path');

const NGROK_API_URL = 'http://127.0.0.1:4040/api/tunnels';
const BASEURL_FILE_PATH = path.join(__dirname, '..', 'assets', 'common', 'baseurl.js');

function getNgrokPublicUrl() {
    return new Promise((resolve, reject) => {
        const request = http.get(NGROK_API_URL, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (!json.tunnels || !Array.isArray(json.tunnels)) {
                        resolve(null);
                        return;
                    }

                    const httpsTunnel = json.tunnels.find((tunnel) => typeof tunnel.public_url === 'string' && tunnel.public_url.startsWith('https://'));
                    const httpTunnel = json.tunnels.find((tunnel) => typeof tunnel.public_url === 'string' && tunnel.public_url.startsWith('http://'));
                    const tunnel = httpsTunnel || httpTunnel || json.tunnels[0];

                    if (!tunnel || !tunnel.public_url) {
                        resolve(null);
                        return;
                    }

                    resolve(tunnel.public_url);
                } catch (error) {
                    reject(error);
                }
            });
        });

        request.on('error', (error) => {
            reject(error);
        });
    });
}

function buildApiBaseUrl(publicUrl) {
    if (!publicUrl) {
        return null;
    }

    const normalized = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;
    return `${normalized}/api/v1/`;
}

function writeBaseUrlFile(apiBaseUrl) {
    const contentLines = [
        "import { Platform } from 'react-native'",
        "",
        `let baseURL = '${apiBaseUrl}'`,
        "",
        "export default baseURL;",
        ""
    ];

    fs.writeFileSync(BASEURL_FILE_PATH, contentLines.join('\n'), { encoding: 'utf8' });
}

async function updateOnce() {
    try {
        const publicUrl = await getNgrokPublicUrl();
        if (!publicUrl) {
            console.log('No ngrok tunnel detected on http://127.0.0.1:4040');
            return;
        }

        const apiBaseUrl = buildApiBaseUrl(publicUrl);
        if (!apiBaseUrl) {
            console.log('Failed to build API base URL from ngrok public URL');
            return;
        }

        writeBaseUrlFile(apiBaseUrl);
        console.log(`Updated baseURL to ${apiBaseUrl}`);
    } catch (error) {
        console.error('Failed to update ngrok URL:', error.message || error);
    }
}

async function watchAndUpdate(intervalMs) {
    let lastBaseUrl = null;

    const tick = async () => {
        try {
            const publicUrl = await getNgrokPublicUrl();
            if (!publicUrl) {
                setTimeout(tick, intervalMs);
                return;
            }

            const apiBaseUrl = buildApiBaseUrl(publicUrl);
            if (!apiBaseUrl || apiBaseUrl === lastBaseUrl) {
                setTimeout(tick, intervalMs);
                return;
            }

            writeBaseUrlFile(apiBaseUrl);
            lastBaseUrl = apiBaseUrl;
            console.log(`Detected ngrok tunnel. Updated baseURL to ${apiBaseUrl}`);
            setTimeout(tick, intervalMs);
        } catch (error) {
            console.error('Error while watching ngrok URL:', error.message || error);
            setTimeout(tick, intervalMs);
        }
    };

    tick();
}

function main() {
    const args = process.argv.slice(2);
    const watch = args.includes('--watch');
    const intervalFlagIndex = args.indexOf('--interval');
    let intervalMs = 5000;

    if (intervalFlagIndex !== -1 && args[intervalFlagIndex + 1]) {
        const parsed = parseInt(args[intervalFlagIndex + 1], 10);
        if (!isNaN(parsed) && parsed > 0) {
            intervalMs = parsed;
        }
    }

    if (watch) {
        console.log(`Watching ngrok on ${NGROK_API_URL} every ${intervalMs}ms...`);
        watchAndUpdate(intervalMs);
    } else {
        updateOnce();
    }
}

main();

