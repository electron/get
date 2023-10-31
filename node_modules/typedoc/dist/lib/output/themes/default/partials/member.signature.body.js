"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memberSignatureBody = void 0;
const utils_1 = require("../../../../utils");
const models_1 = require("../../../../models");
const lib_1 = require("../../lib");
const memberSignatureBody = (context, props, { hideSources = false } = {}) => (utils_1.JSX.createElement(utils_1.JSX.Fragment, null,
    (0, lib_1.renderFlags)(props.flags, props.comment),
    context.comment(props),
    (0, lib_1.hasTypeParameters)(props) && context.typeParameters(props.typeParameters),
    props.parameters && props.parameters.length > 0 && (utils_1.JSX.createElement("div", { class: "tsd-parameters" },
        utils_1.JSX.createElement("h4", { class: "tsd-parameters-title" }, "Parameters"),
        utils_1.JSX.createElement("ul", { class: "tsd-parameter-list" }, props.parameters.map((item) => (utils_1.JSX.createElement("li", null,
            utils_1.JSX.createElement("h5", null,
                (0, lib_1.renderFlags)(item.flags, item.comment),
                !!item.flags.isRest && utils_1.JSX.createElement("span", { class: "tsd-signature-symbol" }, "..."),
                item.name,
                ": ",
                context.type(item.type),
                item.defaultValue != null && (utils_1.JSX.createElement("span", { class: "tsd-signature-symbol" },
                    " = ",
                    item.defaultValue))),
            context.comment(item),
            item.type instanceof models_1.ReflectionType && context.parameter(item.type.declaration))))))),
    props.type && (utils_1.JSX.createElement(utils_1.JSX.Fragment, null,
        utils_1.JSX.createElement("h4", { class: "tsd-returns-title" },
            "Returns ",
            context.type(props.type)),
        props.type instanceof models_1.ReflectionType && context.parameter(props.type.declaration))),
    !hideSources && context.memberSources(props)));
exports.memberSignatureBody = memberSignatureBody;
