'use strict';
// Test-only Node preload, not a replacement for an OS firewall. Allows HTTP
// mock servers on loopback while rejecting external Node fetch/socket calls.
// NODE_OPTIONS propagates it to the Node child processes used by the suites.
const net = require('node:net');
const dns = require('node:dns');
const dgram = require('node:dgram');
const allow = h => h === undefined || h === null || h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '[::1]';
function blocked(type, value) { console.error(`[NETWORK GUARD BLOCKED] ${type}: ${String(value)}`); const e = new Error(`External network blocked (${type}): ${String(value)}`); e.code = 'ENETUNREACH'; return e; }
const originalConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  let first = args[0];
  if (Array.isArray(first)) first = first[0];
  if (typeof first === 'string') throw blocked('unix socket', first);
  if (first && typeof first === 'object' && first.path) throw blocked('unix socket', first.path);
  const host = typeof first === 'number' ? args[1] : first?.host ?? first?.hostname;
  if (typeof host !== 'function' && !allow(host)) throw blocked('socket', host);
  return originalConnect.apply(this, args);
};
const originalLookup = dns.lookup;
dns.lookup = function(host, ...args) { if (!allow(host)) throw blocked('DNS lookup', host); return originalLookup.call(this, host, ...args); };
for (const name of ['resolve','resolve4','resolve6','resolveAny','resolveCname','resolveMx','resolveNaptr','resolveNs','resolvePtr','resolveSoa','resolveSrv','resolveTxt','reverse']) {
  if (typeof dns[name] === 'function') dns[name] = (...args) => { throw blocked(`DNS ${name}`, args[0]); };
}
if (dns.promises) for (const name of Object.keys(dns.promises)) {
  if (typeof dns.promises[name] === 'function' && (name.startsWith('resolve') || name === 'reverse')) dns.promises[name] = (...args) => Promise.reject(blocked(`DNS promise ${name}`, args[0]));
}
for (const name of ['send','connect']) dgram.Socket.prototype[name] = function() { throw blocked('UDP', name); };
const originalFetch = globalThis.fetch;
globalThis.fetch = function(input, init) {
  const url = new URL(input instanceof Request ? input.url : input);
  if ((url.protocol !== 'http:' && url.protocol !== 'https:') || !allow(url.hostname)) return Promise.reject(blocked('fetch', url.href));
  return originalFetch.call(this, input, init);
};
