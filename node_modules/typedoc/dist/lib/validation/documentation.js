"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDocumentation = void 0;
const models_1 = require("../models");
const enum_1 = require("../utils/enum");
function validateDocumentation(project, logger, requiredToBeDocumented) {
    let kinds = requiredToBeDocumented.reduce((prev, cur) => prev | models_1.ReflectionKind[cur], 0);
    // Functions, Constructors, and Accessors never have comments directly on them.
    // If they are required to be documented, what's really required is that their
    // contained signatures have a comment.
    if (kinds & models_1.ReflectionKind.FunctionOrMethod) {
        kinds |= models_1.ReflectionKind.CallSignature;
        kinds = (0, enum_1.removeFlag)(kinds, models_1.ReflectionKind.FunctionOrMethod);
    }
    if (kinds & models_1.ReflectionKind.Constructor) {
        kinds |= models_1.ReflectionKind.ConstructorSignature;
        kinds = (0, enum_1.removeFlag)(kinds, models_1.ReflectionKind.Constructor);
    }
    if (kinds & models_1.ReflectionKind.Accessor) {
        kinds |= models_1.ReflectionKind.GetSignature | models_1.ReflectionKind.SetSignature;
        kinds = (0, enum_1.removeFlag)(kinds, models_1.ReflectionKind.Accessor);
    }
    const toProcess = project.getReflectionsByKind(kinds);
    const seen = new Set();
    while (toProcess.length) {
        const ref = toProcess.shift();
        if (seen.has(ref))
            continue;
        seen.add(ref);
        if (ref instanceof models_1.DeclarationReflection) {
            const signatures = ref.type instanceof models_1.ReflectionType
                ? ref.type.declaration.getNonIndexSignatures()
                : ref.getNonIndexSignatures();
            if (signatures.length) {
                // We maybe used to have a comment, but the comment plugin has removed it.
                // See CommentPlugin.onResolve. We've been asked to validate this reflection,
                // (it's probably a type alias) so we should validate that signatures all have
                // comments, but we shouldn't produce a warning here.
                toProcess.push(...signatures);
                continue;
            }
        }
        let symbol = project.getSymbolFromReflection(ref);
        let index = 0;
        // Signatures don't have symbols associated with them, so get the parent and then
        // maybe also adjust the declaration index that we care about.
        if (!symbol && ref.kindOf(models_1.ReflectionKind.SomeSignature)) {
            symbol = project.getSymbolFromReflection(ref.parent);
            const parentIndex = ref.parent.signatures?.indexOf(ref);
            if (parentIndex) {
                index = parentIndex;
            }
        }
        const decl = symbol?.declarations?.[index];
        if (!ref.hasComment() && decl) {
            const sourceFile = decl.getSourceFile();
            if (sourceFile.fileName.includes("node_modules")) {
                continue;
            }
            logger.warn(`${ref.getFriendlyFullName()} does not have any documentation.`, decl);
        }
    }
}
exports.validateDocumentation = validateDocumentation;
