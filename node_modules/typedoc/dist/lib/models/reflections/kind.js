"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReflectionKind = void 0;
/**
 * Defines the available reflection kinds.
 */
var ReflectionKind;
(function (ReflectionKind) {
    ReflectionKind[ReflectionKind["Project"] = 1] = "Project";
    ReflectionKind[ReflectionKind["Module"] = 2] = "Module";
    ReflectionKind[ReflectionKind["Namespace"] = 4] = "Namespace";
    ReflectionKind[ReflectionKind["Enum"] = 8] = "Enum";
    ReflectionKind[ReflectionKind["EnumMember"] = 16] = "EnumMember";
    ReflectionKind[ReflectionKind["Variable"] = 32] = "Variable";
    ReflectionKind[ReflectionKind["Function"] = 64] = "Function";
    ReflectionKind[ReflectionKind["Class"] = 128] = "Class";
    ReflectionKind[ReflectionKind["Interface"] = 256] = "Interface";
    ReflectionKind[ReflectionKind["Constructor"] = 512] = "Constructor";
    ReflectionKind[ReflectionKind["Property"] = 1024] = "Property";
    ReflectionKind[ReflectionKind["Method"] = 2048] = "Method";
    ReflectionKind[ReflectionKind["CallSignature"] = 4096] = "CallSignature";
    ReflectionKind[ReflectionKind["IndexSignature"] = 8192] = "IndexSignature";
    ReflectionKind[ReflectionKind["ConstructorSignature"] = 16384] = "ConstructorSignature";
    ReflectionKind[ReflectionKind["Parameter"] = 32768] = "Parameter";
    ReflectionKind[ReflectionKind["TypeLiteral"] = 65536] = "TypeLiteral";
    ReflectionKind[ReflectionKind["TypeParameter"] = 131072] = "TypeParameter";
    ReflectionKind[ReflectionKind["Accessor"] = 262144] = "Accessor";
    ReflectionKind[ReflectionKind["GetSignature"] = 524288] = "GetSignature";
    ReflectionKind[ReflectionKind["SetSignature"] = 1048576] = "SetSignature";
    ReflectionKind[ReflectionKind["ObjectLiteral"] = 2097152] = "ObjectLiteral";
    ReflectionKind[ReflectionKind["TypeAlias"] = 4194304] = "TypeAlias";
    ReflectionKind[ReflectionKind["Reference"] = 8388608] = "Reference";
})(ReflectionKind = exports.ReflectionKind || (exports.ReflectionKind = {}));
/** @hidden */
(function (ReflectionKind) {
    ReflectionKind.All = ReflectionKind.Reference * 2 - 1;
    ReflectionKind.ClassOrInterface = ReflectionKind.Class | ReflectionKind.Interface;
    ReflectionKind.VariableOrProperty = ReflectionKind.Variable | ReflectionKind.Property;
    ReflectionKind.FunctionOrMethod = ReflectionKind.Function | ReflectionKind.Method;
    ReflectionKind.ClassMember = ReflectionKind.Accessor |
        ReflectionKind.Constructor |
        ReflectionKind.Method |
        ReflectionKind.Property;
    ReflectionKind.SomeSignature = ReflectionKind.CallSignature |
        ReflectionKind.IndexSignature |
        ReflectionKind.ConstructorSignature |
        ReflectionKind.GetSignature |
        ReflectionKind.SetSignature;
    ReflectionKind.SomeModule = ReflectionKind.Namespace | ReflectionKind.Module;
    ReflectionKind.SomeType = ReflectionKind.Interface |
        ReflectionKind.TypeLiteral |
        ReflectionKind.TypeParameter |
        ReflectionKind.TypeAlias;
    ReflectionKind.SomeValue = ReflectionKind.Variable |
        ReflectionKind.Function |
        ReflectionKind.ObjectLiteral;
    ReflectionKind.SomeMember = ReflectionKind.EnumMember |
        ReflectionKind.Property |
        ReflectionKind.Method |
        ReflectionKind.Accessor;
    ReflectionKind.SomeExport = ReflectionKind.Module |
        ReflectionKind.Namespace |
        ReflectionKind.Enum |
        ReflectionKind.Variable |
        ReflectionKind.Function |
        ReflectionKind.Class |
        ReflectionKind.Interface |
        ReflectionKind.TypeAlias |
        ReflectionKind.Reference;
    ReflectionKind.ExportContainer = ReflectionKind.SomeModule | ReflectionKind.Project;
    /** @internal */
    ReflectionKind.Inheritable = ReflectionKind.Accessor |
        ReflectionKind.IndexSignature |
        ReflectionKind.Property |
        ReflectionKind.Method |
        ReflectionKind.Constructor;
    /** @internal */
    ReflectionKind.ContainsCallSignatures = ReflectionKind.Constructor |
        ReflectionKind.Function |
        ReflectionKind.Method;
    /**
     * Note: This does not include Class/Interface, even though they technically could contain index signatures
     * @internal
     */
    ReflectionKind.SignatureContainer = ReflectionKind.ContainsCallSignatures | ReflectionKind.Accessor;
})(ReflectionKind = exports.ReflectionKind || (exports.ReflectionKind = {}));
