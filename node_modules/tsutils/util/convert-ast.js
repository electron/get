"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertAst = void 0;
const ts = require("typescript");
const util_1 = require("./util");
/**
 * Takes a `ts.SourceFile` and creates data structures that are easier (or more performant) to traverse.
 * Note that there is only a performance gain if you can reuse these structures. It's not recommended for one-time AST walks.
 */
function convertAst(sourceFile) {
    const wrapped = {
        node: sourceFile,
        parent: undefined,
        kind: ts.SyntaxKind.SourceFile,
        children: [],
        next: undefined,
        skip: undefined,
    };
    const flat = [];
    let current = wrapped;
    let previous = current;
    ts.forEachChild(sourceFile, function wrap(node) {
        flat.push(node);
        const parent = current;
        previous.next = current = {
            node,
            parent,
            kind: node.kind,
            children: [],
            next: undefined,
            skip: undefined,
        };
        if (previous !== parent)
            setSkip(previous, current);
        previous = current;
        parent.children.push(current);
        if (util_1.isNodeKind(node.kind))
            ts.forEachChild(node, wrap);
        current = parent;
    });
    return {
        wrapped,
        flat,
    };
}
exports.convertAst = convertAst;
function setSkip(node, skip) {
    do {
        node.skip = skip;
        node = node.parent;
    } while (node !== skip.parent);
}
//# sourceMappingURL=convert-ast.js.map