"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isObjectType = exports.getHeritageTypes = exports.isNamedNode = void 0;
const ts = require("typescript");
function isNamedNode(node) {
    const name = node.name;
    return !!name && (ts.isMemberName(name) || ts.isComputedPropertyName(name));
}
exports.isNamedNode = isNamedNode;
function getHeritageTypes(declarations, kind) {
    const exprs = declarations.flatMap((d) => (d.heritageClauses ?? [])
        .filter((hc) => hc.token === kind)
        .flatMap((hc) => hc.types));
    const seenTexts = new Set();
    return exprs.filter((expr) => {
        const text = expr.getText();
        if (seenTexts.has(text)) {
            return false;
        }
        seenTexts.add(text);
        return true;
    });
}
exports.getHeritageTypes = getHeritageTypes;
function isObjectType(type) {
    return typeof type.objectFlags === "number";
}
exports.isObjectType = isObjectType;
