"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.secondaryNavigation = exports.primaryNavigation = exports.settings = exports.sidebarLinks = exports.navigation = void 0;
const models_1 = require("../../../../models");
const utils_1 = require("../../../../utils");
const lib_1 = require("../../lib");
function navigation(context, props) {
    return (utils_1.JSX.createElement(utils_1.JSX.Fragment, null,
        context.sidebarLinks(),
        context.settings(),
        context.primaryNavigation(props),
        context.secondaryNavigation(props)));
}
exports.navigation = navigation;
function buildFilterItem(context, name, displayName, defaultValue) {
    return (utils_1.JSX.createElement("li", { class: "tsd-filter-item" },
        utils_1.JSX.createElement("label", { class: "tsd-filter-input" },
            utils_1.JSX.createElement("input", { type: "checkbox", id: `tsd-filter-${name}`, name: name, checked: defaultValue }),
            context.icons.checkbox(),
            utils_1.JSX.createElement("span", null, displayName))));
}
function sidebarLinks(context) {
    const links = Object.entries(context.options.getValue("sidebarLinks"));
    if (!links.length)
        return null;
    return (utils_1.JSX.createElement("nav", { id: "tsd-sidebar-links", class: "tsd-navigation" }, links.map(([label, url]) => (utils_1.JSX.createElement("a", { href: url, target: "_blank" }, label)))));
}
exports.sidebarLinks = sidebarLinks;
function settings(context) {
    const defaultFilters = context.options.getValue("visibilityFilters");
    const visibilityOptions = [];
    for (const key of Object.keys(defaultFilters)) {
        if (key.startsWith("@")) {
            const filterName = key
                .substring(1)
                .replace(/([a-z])([A-Z])/g, "$1-$2")
                .toLowerCase();
            visibilityOptions.push(buildFilterItem(context, filterName, (0, lib_1.camelToTitleCase)(key.substring(1)), defaultFilters[key]));
        }
        else if ((key === "protected" && !context.options.getValue("excludeProtected")) ||
            (key === "private" && !context.options.getValue("excludePrivate")) ||
            (key === "external" && !context.options.getValue("excludeExternals")) ||
            key === "inherited") {
            visibilityOptions.push(buildFilterItem(context, key, (0, lib_1.camelToTitleCase)(key), defaultFilters[key]));
        }
    }
    // Settings panel above navigation
    return (utils_1.JSX.createElement("div", { class: "tsd-navigation settings" },
        utils_1.JSX.createElement("details", { class: "tsd-index-accordion", open: false },
            utils_1.JSX.createElement("summary", { class: "tsd-accordion-summary" },
                utils_1.JSX.createElement("h3", null,
                    context.icons.chevronDown(),
                    " Settings")),
            utils_1.JSX.createElement("div", { class: "tsd-accordion-details" },
                visibilityOptions.length && (utils_1.JSX.createElement("div", { class: "tsd-filter-visibility" },
                    utils_1.JSX.createElement("h4", { class: "uppercase" }, "Member Visibility"),
                    utils_1.JSX.createElement("form", null,
                        utils_1.JSX.createElement("ul", { id: "tsd-filter-options" }, ...visibilityOptions)))),
                utils_1.JSX.createElement("div", { class: "tsd-theme-toggle" },
                    utils_1.JSX.createElement("h4", { class: "uppercase" }, "Theme"),
                    utils_1.JSX.createElement("select", { id: "theme" },
                        utils_1.JSX.createElement("option", { value: "os" }, "OS"),
                        utils_1.JSX.createElement("option", { value: "light" }, "Light"),
                        utils_1.JSX.createElement("option", { value: "dark" }, "Dark")))))));
}
exports.settings = settings;
function primaryNavigation(context, props) {
    // Create the navigation for the current page
    const modules = props.model.project.getChildrenByKind(models_1.ReflectionKind.SomeModule);
    const [ext, int] = (0, utils_1.partition)(modules, (m) => m.flags.isExternal);
    const selected = props.model.isProject();
    const current = selected || int.some((mod) => inPath(mod, props.model));
    return (utils_1.JSX.createElement("nav", { class: "tsd-navigation primary" },
        utils_1.JSX.createElement("details", { class: "tsd-index-accordion", open: true },
            utils_1.JSX.createElement("summary", { class: "tsd-accordion-summary" },
                utils_1.JSX.createElement("h3", null,
                    context.icons.chevronDown(),
                    " Modules")),
            utils_1.JSX.createElement("div", { class: "tsd-accordion-details" },
                utils_1.JSX.createElement("ul", null,
                    utils_1.JSX.createElement("li", { class: (0, lib_1.classNames)({ current, selected }) },
                        utils_1.JSX.createElement("a", { href: context.urlTo(props.model.project) }, (0, lib_1.wbr)(props.project.name)),
                        utils_1.JSX.createElement("ul", null, int.map(link))),
                    ext.map(link))))));
    function link(mod) {
        const current = inPath(mod, props.model);
        const selected = mod.name === props.model.name;
        let childNav;
        const childModules = mod.children?.filter((m) => m.kindOf(models_1.ReflectionKind.SomeModule));
        if (childModules?.length) {
            childNav = utils_1.JSX.createElement("ul", null, childModules.map(link));
        }
        return (utils_1.JSX.createElement("li", { class: (0, lib_1.classNames)({ current, selected, deprecated: mod.isDeprecated() }, mod.cssClasses) },
            utils_1.JSX.createElement("a", { href: context.urlTo(mod) }, (0, lib_1.wbr)(`${mod.name}${mod.version !== undefined ? ` - v${mod.version}` : ""}`)),
            childNav));
    }
}
exports.primaryNavigation = primaryNavigation;
function secondaryNavigation(context, props) {
    // Multiple entry points, and on main project page.
    if (props.model.isProject() && props.model.getChildrenByKind(models_1.ReflectionKind.Module).length) {
        return;
    }
    const effectivePageParent = (props.model instanceof models_1.ContainerReflection && props.model.children?.length) || props.model.isProject()
        ? props.model
        : props.model.parent;
    const children = effectivePageParent.children || [];
    const pageNavigation = children
        .filter((child) => !child.kindOf(models_1.ReflectionKind.SomeModule))
        .map((child) => {
        return (utils_1.JSX.createElement("li", { class: (0, lib_1.classNames)({ deprecated: child.isDeprecated(), current: props.model === child }, child.cssClasses) },
            utils_1.JSX.createElement("a", { href: context.urlTo(child), class: "tsd-index-link" },
                context.icons[child.kind](),
                (0, lib_1.renderName)(child))));
    });
    if (effectivePageParent.kindOf(models_1.ReflectionKind.SomeModule | models_1.ReflectionKind.Project)) {
        return (utils_1.JSX.createElement("nav", { class: "tsd-navigation secondary menu-sticky" }, !!pageNavigation.length && utils_1.JSX.createElement("ul", null, pageNavigation)));
    }
    return (utils_1.JSX.createElement("nav", { class: "tsd-navigation secondary menu-sticky" },
        utils_1.JSX.createElement("ul", null,
            utils_1.JSX.createElement("li", { class: (0, lib_1.classNames)({
                    deprecated: effectivePageParent.isDeprecated(),
                    current: effectivePageParent === props.model,
                }, effectivePageParent.cssClasses) },
                utils_1.JSX.createElement("a", { href: context.urlTo(effectivePageParent), class: "tsd-index-link" },
                    context.icons[effectivePageParent.kind](),
                    utils_1.JSX.createElement("span", null, (0, lib_1.renderName)(effectivePageParent))),
                !!pageNavigation.length && utils_1.JSX.createElement("ul", null, pageNavigation)))));
}
exports.secondaryNavigation = secondaryNavigation;
function inPath(thisPage, toCheck) {
    while (toCheck) {
        if (toCheck.isProject())
            return false;
        if (thisPage === toCheck)
            return true;
        toCheck = toCheck.parent;
    }
    return false;
}
