"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLayout = void 0;
const utils_1 = require("../../../../utils");
const defaultLayout = (context, props) => (utils_1.JSX.createElement("html", { class: "default", lang: context.options.getValue("htmlLang") },
    utils_1.JSX.createElement("head", null,
        utils_1.JSX.createElement("meta", { charSet: "utf-8" }),
        context.hook("head.begin"),
        utils_1.JSX.createElement("meta", { "http-equiv": "x-ua-compatible", content: "IE=edge" }),
        utils_1.JSX.createElement("title", null, props.model.name === props.project.name
            ? props.project.name
            : `${props.model.name} | ${props.project.name}`),
        utils_1.JSX.createElement("meta", { name: "description", content: "Documentation for " + props.project.name }),
        utils_1.JSX.createElement("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }),
        utils_1.JSX.createElement("link", { rel: "stylesheet", href: context.relativeURL("assets/style.css") }),
        utils_1.JSX.createElement("link", { rel: "stylesheet", href: context.relativeURL("assets/highlight.css") }),
        context.options.getValue("customCss") && (utils_1.JSX.createElement("link", { rel: "stylesheet", href: context.relativeURL("assets/custom.css") })),
        utils_1.JSX.createElement("script", { async: true, src: context.relativeURL("assets/search.js"), id: "search-script" }),
        context.hook("head.end")),
    utils_1.JSX.createElement("body", null,
        context.hook("body.begin"),
        utils_1.JSX.createElement("script", null,
            utils_1.JSX.createElement(utils_1.Raw, { html: 'document.documentElement.dataset.theme = localStorage.getItem("tsd-theme") || "os"' })),
        context.toolbar(props),
        utils_1.JSX.createElement("div", { class: "container container-main" },
            utils_1.JSX.createElement("div", { class: "col-8 col-content" },
                context.hook("content.begin"),
                context.header(props),
                props.template(props),
                context.hook("content.end")),
            utils_1.JSX.createElement("div", { class: "col-4 col-menu menu-sticky-wrap menu-highlight" },
                context.hook("navigation.begin"),
                context.navigation(props),
                context.hook("navigation.end"))),
        context.footer(),
        utils_1.JSX.createElement("div", { class: "overlay" }),
        utils_1.JSX.createElement("script", { src: context.relativeURL("assets/main.js") }),
        context.analytics(),
        context.hook("body.end"))));
exports.defaultLayout = defaultLayout;
