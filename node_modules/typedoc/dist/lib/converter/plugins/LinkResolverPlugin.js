"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkResolverPlugin = void 0;
const components_1 = require("../components");
const converter_events_1 = require("../converter-events");
const utils_1 = require("../../utils");
const models_1 = require("../../models");
const reflections_1 = require("../../utils/reflections");
/**
 * A plugin that resolves `{@link Foo}` tags.
 */
let LinkResolverPlugin = class LinkResolverPlugin extends components_1.ConverterComponent {
    /**
     * Create a new LinkResolverPlugin instance.
     */
    initialize() {
        super.initialize();
        this.owner.on(converter_events_1.ConverterEvents.RESOLVE_END, this.onResolve, this, -300);
    }
    onResolve(context) {
        for (const reflection of Object.values(context.project.reflections)) {
            if (reflection.comment) {
                context.converter.resolveLinks(reflection.comment, reflection);
            }
            if (reflection instanceof models_1.DeclarationReflection &&
                reflection.readme) {
                reflection.readme = context.converter.resolveLinks(reflection.readme, reflection);
            }
        }
        if (context.project.readme) {
            context.project.readme = context.converter.resolveLinks(context.project.readme, context.project);
        }
        for (const { type } of (0, reflections_1.discoverAllReferenceTypes)(context.project, false)) {
            if (!type.reflection) {
                type.externalUrl = context.converter.resolveExternalLink(type.toDeclarationReference());
            }
        }
    }
};
__decorate([
    (0, utils_1.BindOption)("validation")
], LinkResolverPlugin.prototype, "validation", void 0);
LinkResolverPlugin = __decorate([
    (0, components_1.Component)({ name: "link-resolver" })
], LinkResolverPlugin);
exports.LinkResolverPlugin = LinkResolverPlugin;
