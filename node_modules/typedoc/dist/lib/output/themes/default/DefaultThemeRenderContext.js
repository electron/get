"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultThemeRenderContext = void 0;
const lib_1 = require("../lib");
const default_1 = require("./layouts/default");
const partials_1 = require("./partials");
const analytics_1 = require("./partials/analytics");
const breadcrumb_1 = require("./partials/breadcrumb");
const comment_1 = require("./partials/comment");
const footer_1 = require("./partials/footer");
const header_1 = require("./partials/header");
const hierarchy_1 = require("./partials/hierarchy");
const icon_1 = require("./partials/icon");
const member_1 = require("./partials/member");
const member_declaration_1 = require("./partials/member.declaration");
const member_getterSetter_1 = require("./partials/member.getterSetter");
const member_reference_1 = require("./partials/member.reference");
const member_signature_body_1 = require("./partials/member.signature.body");
const member_signature_title_1 = require("./partials/member.signature.title");
const member_signatures_1 = require("./partials/member.signatures");
const member_sources_1 = require("./partials/member.sources");
const members_1 = require("./partials/members");
const members_group_1 = require("./partials/members.group");
const navigation_1 = require("./partials/navigation");
const parameter_1 = require("./partials/parameter");
const toolbar_1 = require("./partials/toolbar");
const type_1 = require("./partials/type");
const typeAndParent_1 = require("./partials/typeAndParent");
const typeParameters_1 = require("./partials/typeParameters");
const templates_1 = require("./templates");
const reflection_1 = require("./templates/reflection");
function bind(fn, first) {
    return (...r) => fn(first, ...r);
}
class DefaultThemeRenderContext {
    constructor(theme, options) {
        this.theme = theme;
        this.icons = icon_1.icons;
        this.hook = (name) => this.theme.owner.hooks.emit(name, this);
        /** Avoid this in favor of urlTo if possible */
        this.relativeURL = (url) => {
            return url ? this.theme.markedPlugin.getRelativeUrl(url) : url;
        };
        this.urlTo = (reflection) => this.relativeURL(reflection.url);
        this.markdown = (md) => {
            if (md instanceof Array) {
                return this.theme.markedPlugin.parseMarkdown((0, lib_1.displayPartsToMarkdown)(md, this.urlTo));
            }
            return md ? this.theme.markedPlugin.parseMarkdown(md) : "";
        };
        /**
         * Using this method will repeat work already done, instead of calling it, use `type.externalUrl`.
         * @deprecated
         * Will be removed in 0.24.
         */
        this.attemptExternalResolution = (type) => {
            return type.externalUrl;
        };
        this.reflectionTemplate = bind(reflection_1.reflectionTemplate, this);
        this.indexTemplate = bind(templates_1.indexTemplate, this);
        this.defaultLayout = bind(default_1.defaultLayout, this);
        this.analytics = bind(analytics_1.analytics, this);
        this.breadcrumb = bind(breadcrumb_1.breadcrumb, this);
        this.comment = bind(comment_1.comment, this);
        this.footer = bind(footer_1.footer, this);
        this.header = bind(header_1.header, this);
        this.hierarchy = bind(hierarchy_1.hierarchy, this);
        this.index = bind(partials_1.index, this);
        this.member = bind(member_1.member, this);
        this.memberDeclaration = bind(member_declaration_1.memberDeclaration, this);
        this.memberGetterSetter = bind(member_getterSetter_1.memberGetterSetter, this);
        this.memberReference = bind(member_reference_1.memberReference, this);
        this.memberSignatureBody = bind(member_signature_body_1.memberSignatureBody, this);
        this.memberSignatureTitle = bind(member_signature_title_1.memberSignatureTitle, this);
        this.memberSignatures = bind(member_signatures_1.memberSignatures, this);
        this.memberSources = bind(member_sources_1.memberSources, this);
        this.members = bind(members_1.members, this);
        this.membersGroup = bind(members_group_1.membersGroup, this);
        this.navigation = bind(navigation_1.navigation, this);
        this.sidebarLinks = bind(navigation_1.sidebarLinks, this);
        this.settings = bind(navigation_1.settings, this);
        this.primaryNavigation = bind(navigation_1.primaryNavigation, this);
        this.secondaryNavigation = bind(navigation_1.secondaryNavigation, this);
        this.parameter = bind(parameter_1.parameter, this);
        this.toolbar = bind(toolbar_1.toolbar, this);
        this.type = bind(type_1.type, this);
        this.typeAndParent = bind(typeAndParent_1.typeAndParent, this);
        this.typeParameters = bind(typeParameters_1.typeParameters, this);
        this.options = options;
    }
}
exports.DefaultThemeRenderContext = DefaultThemeRenderContext;
