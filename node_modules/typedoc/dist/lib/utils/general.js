"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLoadedPaths = exports.hasBeenLoadedMultipleTimes = exports.assertNever = void 0;
const path_1 = require("path");
const Util = require("util");
/**
 * Utility to help type checking ensure that there is no uncovered case.
 */
function assertNever(x) {
    throw new Error(`Expected handling to cover all possible cases, but it didn't cover: ${Util.inspect(x)}`);
}
exports.assertNever = assertNever;
/**
 * This is a hack to make it possible to detect and warn about installation setups
 * which result in TypeDoc being installed multiple times. If TypeDoc has been loaded
 * multiple times, then parts of it will not work as expected.
 */
const loadSymbol = Symbol.for("typedoc_loads");
const pathSymbol = Symbol.for("typedoc_paths");
const g = globalThis;
g[loadSymbol] = (g[loadSymbol] || 0) + 1;
g[pathSymbol] || (g[pathSymbol] = []);
// transform /abs/path/to/typedoc/dist/lib/utils/general -> /abs/path/to/typedoc
g[pathSymbol].push((0, path_1.dirname)((0, path_1.dirname)((0, path_1.dirname)(__dirname))));
function hasBeenLoadedMultipleTimes() {
    return g[loadSymbol] !== 1;
}
exports.hasBeenLoadedMultipleTimes = hasBeenLoadedMultipleTimes;
function getLoadedPaths() {
    return g[pathSymbol] || [];
}
exports.getLoadedPaths = getLoadedPaths;
