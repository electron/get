"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderName = exports.displayPartsToMarkdown = exports.camelToTitleCase = exports.renderTypeParametersSignature = exports.hasTypeParameters = exports.classNames = exports.renderFlags = exports.join = exports.wbr = exports.stringify = void 0;
const models_1 = require("../../models");
const utils_1 = require("../../utils");
function stringify(data) {
    if (typeof data === "bigint") {
        return data.toString() + "n";
    }
    return JSON.stringify(data);
}
exports.stringify = stringify;
/**
 * Insert word break tags ``<wbr>`` into the given string.
 *
 * Breaks the given string at ``_``, ``-`` and capital letters.
 *
 * @param str The string that should be split.
 * @return The original string containing ``<wbr>`` tags where possible.
 */
function wbr(str) {
    // TODO surely there is a better way to do this, but I'm tired.
    const ret = [];
    const re = /[\s\S]*?(?:[^_-][_-](?=[^_-])|[^A-Z](?=[A-Z][^A-Z]))/g;
    let match;
    let i = 0;
    while ((match = re.exec(str))) {
        ret.push(match[0], utils_1.JSX.createElement("wbr", null));
        i += match[0].length;
    }
    ret.push(str.slice(i));
    return ret;
}
exports.wbr = wbr;
function join(joiner, list, cb) {
    const result = [];
    for (const item of list) {
        if (result.length > 0) {
            result.push(joiner);
        }
        result.push(cb(item));
    }
    return utils_1.JSX.createElement(utils_1.JSX.Fragment, null, result);
}
exports.join = join;
function renderFlags(flags, comment) {
    const allFlags = [...flags];
    if (comment) {
        allFlags.push(...Array.from(comment.modifierTags, (tag) => tag.replace(/@([a-z])/, (x) => x[1].toUpperCase())));
    }
    return (utils_1.JSX.createElement(utils_1.JSX.Fragment, null, allFlags.map((item) => (utils_1.JSX.createElement(utils_1.JSX.Fragment, null,
        utils_1.JSX.createElement("code", { class: "tsd-tag ts-flag" + item }, item),
        " ")))));
}
exports.renderFlags = renderFlags;
function classNames(names, extraCss) {
    const css = Object.keys(names)
        .filter((key) => names[key])
        .concat(extraCss || "")
        .join(" ")
        .trim()
        .replace(/\s+/g, " ");
    return css.length ? css : undefined;
}
exports.classNames = classNames;
function hasTypeParameters(reflection) {
    return ((reflection instanceof models_1.DeclarationReflection || reflection instanceof models_1.SignatureReflection) &&
        reflection.typeParameters != null &&
        reflection.typeParameters.length > 0);
}
exports.hasTypeParameters = hasTypeParameters;
function renderTypeParametersSignature(typeParameters) {
    return (utils_1.JSX.createElement(utils_1.JSX.Fragment, null, !!typeParameters && typeParameters.length > 0 && (utils_1.JSX.createElement(utils_1.JSX.Fragment, null,
        utils_1.JSX.createElement("span", { class: "tsd-signature-symbol" }, "<"),
        join(utils_1.JSX.createElement("span", { class: "tsd-signature-symbol" }, ", "), typeParameters, (item) => (utils_1.JSX.createElement(utils_1.JSX.Fragment, null,
            item.varianceModifier ? `${item.varianceModifier} ` : "",
            utils_1.JSX.createElement("span", { class: "tsd-signature-type", "data-tsd-kind": item.kindString }, item.name)))),
        utils_1.JSX.createElement("span", { class: "tsd-signature-symbol" }, ">")))));
}
exports.renderTypeParametersSignature = renderTypeParametersSignature;
function camelToTitleCase(text) {
    return text.substring(0, 1).toUpperCase() + text.substring(1).replace(/[a-z][A-Z]/g, (x) => `${x[0]} ${x[1]}`);
}
exports.camelToTitleCase = camelToTitleCase;
function displayPartsToMarkdown(parts, urlTo) {
    const result = [];
    for (const part of parts) {
        switch (part.kind) {
            case "text":
            case "code":
                result.push(part.text);
                break;
            case "inline-tag":
                switch (part.tag) {
                    case "@label":
                    case "@inheritdoc": // Shouldn't happen
                        break; // Not rendered.
                    case "@link":
                    case "@linkcode":
                    case "@linkplain": {
                        if (part.target) {
                            const url = typeof part.target === "string" ? part.target : urlTo(part.target);
                            const wrap = part.tag === "@linkcode" ? "`" : "";
                            result.push(url ? `[${wrap}${part.text}${wrap}](${url})` : part.text);
                        }
                        else {
                            result.push(part.text);
                        }
                        break;
                    }
                    default:
                        // Hmm... probably want to be able to render these somehow, so custom inline tags can be given
                        // special rendering rules. Future capability. For now, just render their text.
                        result.push(`{${part.tag} ${part.text}}`);
                        break;
                }
                break;
            default:
                (0, utils_1.assertNever)(part);
        }
    }
    return result.join("");
}
exports.displayPartsToMarkdown = displayPartsToMarkdown;
/**
 * Renders the reflection name with an additional `?` if optional.
 */
function renderName(refl) {
    if (!refl.name) {
        return utils_1.JSX.createElement("em", null, wbr(refl.kindString));
    }
    if (refl.flags.isOptional) {
        return utils_1.JSX.createElement(utils_1.JSX.Fragment, null,
            wbr(refl.name),
            "?");
    }
    return wbr(refl.name);
}
exports.renderName = renderName;
