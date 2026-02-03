
const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, '../src/mcp-server.ts');
const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const args = ['ts-node', serverPath];

const server = spawn(cmd, args, {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env },
    shell: true,
    stdio: ['pipe', 'pipe', 'inherit'] // pipe stdin/stdout, inherit stderr
});

console.log('Starting MCP server...');

const request = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
            name: "test-client",
            version: "1.0.0"
        }
    }
};

server.stdin.write(JSON.stringify(request) + '\n');

server.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());

    for (const line of lines) {
        console.log('Received:', line);
        try {
            const response = JSON.parse(line);
            if (response.id === 1 && response.result) {
                console.log('Initialization successful!');

                // Send initialized notification
                server.stdin.write(JSON.stringify({
                    jsonrpc: "2.0",
                    method: "notifications/initialized"
                }) + '\n');

                // Request tools list
                console.log('Requesting tools...');
                server.stdin.write(JSON.stringify({
                    jsonrpc: "2.0",
                    id: 2,
                    method: "tools/list"
                }) + '\n');
            } else if (response.id === 2 && response.result) {
                console.log('Tools list received:', JSON.stringify(response.result.tools, null, 2));
                console.log('Test passed!');
                process.exit(0);
            }
        } catch (e) {
            console.error('Error parsing JSON:', e);
        }
    }
});

server.on('close', (code) => {
    console.log(`Server exited with code ${code}`);
});

// Timeout
setTimeout(() => {
    console.error('Test timed out');
    server.kill();
    process.exit(1);
}, 10000);
