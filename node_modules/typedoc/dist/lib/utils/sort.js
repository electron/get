"use strict";
/**
 * Module which handles sorting reflections according to a user specified strategy.
 * @module
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortReflections = exports.SORT_STRATEGIES = void 0;
const kind_1 = require("../models/reflections/kind");
const types_1 = require("../models/types");
exports.SORT_STRATEGIES = [
    "source-order",
    "alphabetical",
    "enum-value-ascending",
    "enum-value-descending",
    "static-first",
    "instance-first",
    "visibility",
    "required-first",
    "kind",
];
// Return true if a < b
const sorts = {
    "source-order"(a, b) {
        const aSymbol = a.project.getSymbolFromReflection(a);
        const bSymbol = b.project.getSymbolFromReflection(b);
        // This is going to be somewhat ambiguous. No way around that. Treat the first
        // declaration of a symbol as its ordering declaration.
        const aDecl = aSymbol?.getDeclarations()?.[0];
        const bDecl = bSymbol?.getDeclarations()?.[0];
        if (aDecl && bDecl) {
            const aFile = aDecl.getSourceFile().fileName;
            const bFile = bDecl.getSourceFile().fileName;
            if (aFile < bFile) {
                return true;
            }
            if (aFile == bFile && aDecl.pos < bDecl.pos) {
                return true;
            }
            return false;
        }
        // Someone is doing something weird. Fail to re-order. This *might* be a bug in TD
        // but it could also be TS having some exported symbol without a declaration.
        return false;
    },
    alphabetical(a, b) {
        return a.name < b.name;
    },
    "enum-value-ascending"(a, b) {
        if (a.kind == kind_1.ReflectionKind.EnumMember &&
            b.kind == kind_1.ReflectionKind.EnumMember) {
            const aValue = a.type instanceof types_1.LiteralType ? a.type.value : -Infinity;
            const bValue = b.type instanceof types_1.LiteralType ? b.type.value : -Infinity;
            return aValue < bValue;
        }
        return false;
    },
    "enum-value-descending"(a, b) {
        if (a.kind == kind_1.ReflectionKind.EnumMember &&
            b.kind == kind_1.ReflectionKind.EnumMember) {
            const aValue = a.type instanceof types_1.LiteralType ? a.type.value : -Infinity;
            const bValue = b.type instanceof types_1.LiteralType ? b.type.value : -Infinity;
            return bValue < aValue;
        }
        return false;
    },
    "static-first"(a, b) {
        return a.flags.isStatic && !b.flags.isStatic;
    },
    "instance-first"(a, b) {
        return !a.flags.isStatic && b.flags.isStatic;
    },
    visibility(a, b) {
        // Note: flags.isPublic may not be set on public members. It will only be set
        // if the user explicitly marks members as public. Therefore, we can't use it
        // here to get a reliable sort order.
        if (a.flags.isPrivate) {
            return false; // Not sorted before anything
        }
        if (a.flags.isProtected) {
            return b.flags.isPrivate; // Sorted before privates
        }
        if (b.flags.isPrivate || b.flags.isProtected) {
            return true; // We are public, sort before b if b is less visible
        }
        return false;
    },
    "required-first"(a, b) {
        return !a.flags.isOptional && b.flags.isOptional;
    },
    kind(a, b) {
        const weights = [
            kind_1.ReflectionKind.Reference,
            kind_1.ReflectionKind.Project,
            kind_1.ReflectionKind.Module,
            kind_1.ReflectionKind.Namespace,
            kind_1.ReflectionKind.Enum,
            kind_1.ReflectionKind.EnumMember,
            kind_1.ReflectionKind.Class,
            kind_1.ReflectionKind.Interface,
            kind_1.ReflectionKind.TypeAlias,
            kind_1.ReflectionKind.Constructor,
            kind_1.ReflectionKind.Property,
            kind_1.ReflectionKind.Variable,
            kind_1.ReflectionKind.Function,
            kind_1.ReflectionKind.Accessor,
            kind_1.ReflectionKind.Method,
            kind_1.ReflectionKind.ObjectLiteral,
            kind_1.ReflectionKind.Parameter,
            kind_1.ReflectionKind.TypeParameter,
            kind_1.ReflectionKind.TypeLiteral,
            kind_1.ReflectionKind.CallSignature,
            kind_1.ReflectionKind.ConstructorSignature,
            kind_1.ReflectionKind.IndexSignature,
            kind_1.ReflectionKind.GetSignature,
            kind_1.ReflectionKind.SetSignature,
        ];
        return weights.indexOf(a.kind) < weights.indexOf(b.kind);
    },
};
function sortReflections(reflections, strategies) {
    reflections.sort((a, b) => {
        for (const s of strategies) {
            if (sorts[s](a, b)) {
                return -1;
            }
            if (sorts[s](b, a)) {
                return 1;
            }
        }
        return 0;
    });
}
exports.sortReflections = sortReflections;
