// Universal no-op stub for native-only modules on web.
// Returns a Proxy so any property access returns a no-op function,
// preventing "X is not a function" errors when module code runs on web.
const noop = () => {};
const asyncNoop = async () => {};

const handler = {
  get(_target, prop) {
    if (prop === "__esModule") return true;
    if (prop === "default") return stub;
    if (prop === "then") return undefined; // don't make it a Promise
    return stub;
  },
};

const stub = new Proxy(
  Object.assign(noop, { isTaskDefined: () => false, addListener: noop, removeAllListeners: noop }),
  handler
);

module.exports = stub;
module.exports.default = stub;
