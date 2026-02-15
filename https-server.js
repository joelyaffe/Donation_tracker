const https = require('https');
const { createProxyMiddleware } = require('http-proxy-middleware');
const fs = require('fs');
const path = require('path');

const options = {
  key: fs.readFileSync(path.join(__dirname, 'certs/localhost.key')),
  cert: fs.readFileSync(path.join(__dirname, 'certs/localhost.crt'))
};

const proxy = createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  ws: true
});

const server = https.createServer(options, (req, res) => {
  proxy(req, res);
});

server.on('upgrade', (req, socket, head) => {
  proxy.upgrade(req, socket, head);
});

const PORT = 3443;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTPS proxy running at https://192.168.1.195:${PORT}`);
  console.log('Proxying to http://localhost:3000');
});
