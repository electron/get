"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJsDocComment = exports.getSignatureComment = exports.getComment = void 0;
const ts = require("typescript");
const models_1 = require("../../models");
const utils_1 = require("../../utils");
const blockLexer_1 = require("./blockLexer");
const discovery_1 = require("./discovery");
const lineLexer_1 = require("./lineLexer");
const parser_1 = require("./parser");
const jsDocCommentKinds = [
    ts.SyntaxKind.JSDocPropertyTag,
    ts.SyntaxKind.JSDocCallbackTag,
    ts.SyntaxKind.JSDocTypedefTag,
    ts.SyntaxKind.JSDocTemplateTag,
    ts.SyntaxKind.JSDocEnumTag,
];
const commentCache = new WeakMap();
function getCommentWithCache(discovered, config, logger) {
    if (!discovered)
        return;
    const [file, ranges] = discovered;
    const cache = commentCache.get(file) || new Map();
    if (cache?.has(ranges[0].pos)) {
        return cache.get(ranges[0].pos).clone();
    }
    let comment;
    switch (ranges[0].kind) {
        case ts.SyntaxKind.MultiLineCommentTrivia:
            comment = (0, parser_1.parseComment)((0, blockLexer_1.lexBlockComment)(file.text, ranges[0].pos, ranges[0].end), config, file, logger);
            break;
        case ts.SyntaxKind.SingleLineCommentTrivia:
            comment = (0, parser_1.parseComment)((0, lineLexer_1.lexLineComments)(file.text, ranges), config, file, logger);
            break;
        default:
            (0, utils_1.assertNever)(ranges[0].kind);
    }
    cache.set(ranges[0].pos, comment);
    commentCache.set(file, cache);
    return comment.clone();
}
function getCommentImpl(commentSource, config, logger, moduleComment) {
    const comment = getCommentWithCache(commentSource, config, logger);
    if (moduleComment && comment) {
        // Module comment, make sure it is tagged with @packageDocumentation or @module.
        // If it isn't then the comment applies to the first statement in the file, so throw it away.
        if (!comment.hasModifier("@packageDocumentation") &&
            !comment.getTag("@module")) {
            return;
        }
    }
    if (!moduleComment && comment) {
        // Ensure module comments are not attached to non-module reflections.
        if (comment.hasModifier("@packageDocumentation") ||
            comment.getTag("@module")) {
            return;
        }
    }
    return comment;
}
function getComment(symbol, kind, config, logger, commentStyle) {
    if (symbol
        .getDeclarations()
        ?.every((d) => jsDocCommentKinds.includes(d.kind))) {
        return getJsDocComment(symbol.declarations[0], config, logger);
    }
    const comment = getCommentImpl((0, discovery_1.discoverComment)(symbol, kind, logger, commentStyle), config, logger, symbol.declarations?.some(ts.isSourceFile) || false);
    if (!comment && kind === models_1.ReflectionKind.Property) {
        return getConstructorParamPropertyComment(symbol, config, logger, commentStyle);
    }
    return comment;
}
exports.getComment = getComment;
function getConstructorParamPropertyComment(symbol, config, logger, commentStyle) {
    const decl = symbol.declarations?.find(ts.isParameter);
    if (!decl)
        return;
    const ctor = decl.parent;
    const comment = getSignatureComment(ctor, config, logger, commentStyle);
    const paramTag = comment?.getIdentifiedTag(symbol.name, "@param");
    if (paramTag) {
        return new models_1.Comment(paramTag.content);
    }
}
function getSignatureComment(declaration, config, logger, commentStyle) {
    return getCommentImpl((0, discovery_1.discoverSignatureComment)(declaration, commentStyle), config, logger, false);
}
exports.getSignatureComment = getSignatureComment;
function getJsDocComment(declaration, config, logger) {
    const file = declaration.getSourceFile();
    // First, get the whole comment. We know we'll need all of it.
    let parent = declaration.parent;
    while (!ts.isJSDoc(parent)) {
        parent = parent.parent;
    }
    // Then parse it.
    const comment = getCommentWithCache([
        file,
        [
            {
                kind: ts.SyntaxKind.MultiLineCommentTrivia,
                pos: parent.pos,
                end: parent.end,
            },
        ],
    ], config, logger);
    // And pull out the tag we actually care about.
    if (ts.isJSDocEnumTag(declaration)) {
        return new models_1.Comment(comment.getTag("@enum")?.content);
    }
    if (ts.isJSDocTemplateTag(declaration) &&
        declaration.comment &&
        declaration.typeParameters.length > 1) {
        // We could just put the same comment on everything, but due to how comment parsing works,
        // we'd have to search for any @template with a name starting with the first type parameter's name
        // which feels horribly hacky.
        logger.warn(`TypeDoc does not support multiple type parameters defined in a single @template tag with a comment.`, declaration);
        return;
    }
    let name;
    if (ts.isJSDocTemplateTag(declaration)) {
        // This isn't really ideal.
        name = declaration.typeParameters[0].name.text;
    }
    else {
        name = declaration.name?.getText();
    }
    if (!name) {
        return;
    }
    const tag = comment.getIdentifiedTag(name, `@${declaration.tagName.text}`);
    if (!tag) {
        logger.error(`Failed to find JSDoc tag for ${name} after parsing comment, please file a bug report.`, declaration);
    }
    else {
        return new models_1.Comment(models_1.Comment.cloneDisplayParts(tag.content));
    }
}
exports.getJsDocComment = getJsDocComment;
