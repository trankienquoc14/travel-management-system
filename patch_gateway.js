const fs = require('fs');
let code = fs.readFileSync('microservices/api-gateway/server.js', 'utf8');

// The default target 'http://localhost:5000' causes an infinite loop 
// when a non-API request (e.g. /uploads/undefined) misses the router.
// We change the target to a non-existent port to fail fast, or just filter it.
code = code.replace(
    "target: 'http://localhost:5000', // Default dummy target, will be overridden by router",
    "target: 'http://127.0.0.1:9999', // Fail fast instead of infinite loop"
);

// Better yet, explicitly mount the proxy ONLY on /api so that /uploads or / non-api routes don't get proxied
code = code.replace(
    "app.use('/', createProxyMiddleware({",
    "app.use('/api', createProxyMiddleware({"
);

fs.writeFileSync('microservices/api-gateway/server.js', code, 'utf8');
console.log('Patched API gateway proxy loop successfully');
