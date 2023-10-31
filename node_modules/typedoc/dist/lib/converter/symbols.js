"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertSymbol = void 0;
const assert = require("assert");
const ts = require("typescript");
const models_1 = require("../models");
const enum_1 = require("../utils/enum");
const convert_expression_1 = require("./convert-expression");
const index_signature_1 = require("./factories/index-signature");
const signature_1 = require("./factories/signature");
const jsdoc_1 = require("./jsdoc");
const nodes_1 = require("./utils/nodes");
const reflections_1 = require("./utils/reflections");
const symbolConverters = {
    [ts.SymbolFlags.RegularEnum]: convertEnum,
    [ts.SymbolFlags.ConstEnum]: convertEnum,
    [ts.SymbolFlags.EnumMember]: convertEnumMember,
    [ts.SymbolFlags.ValueModule]: convertNamespace,
    [ts.SymbolFlags.NamespaceModule]: convertNamespace,
    [ts.SymbolFlags.TypeAlias]: convertTypeAlias,
    [ts.SymbolFlags.Function]: convertFunctionOrMethod,
    [ts.SymbolFlags.Method]: convertFunctionOrMethod,
    [ts.SymbolFlags.Interface]: convertClassOrInterface,
    [ts.SymbolFlags.Property]: convertProperty,
    [ts.SymbolFlags.Class]: convertClassOrInterface,
    [ts.SymbolFlags.Constructor]: convertConstructor,
    [ts.SymbolFlags.Alias]: convertAlias,
    [ts.SymbolFlags.BlockScopedVariable]: convertVariable,
    [ts.SymbolFlags.FunctionScopedVariable]: convertVariable,
    [ts.SymbolFlags.ExportValue]: convertVariable,
    [ts.SymbolFlags.GetAccessor]: convertAccessor,
    [ts.SymbolFlags.SetAccessor]: convertAccessor,
};
const allConverterFlags = Object.keys(symbolConverters).reduce((v, k) => v | +k, 0);
// This is kind of a hack, born of resolving references by symbols instead
// of by source location.
const conversionOrder = [
    // Do enums before namespaces so that @hidden on a namespace
    // merged with an enum works properly.
    ts.SymbolFlags.RegularEnum,
    ts.SymbolFlags.ConstEnum,
    ts.SymbolFlags.EnumMember,
    // Before type alias
    ts.SymbolFlags.BlockScopedVariable,
    ts.SymbolFlags.FunctionScopedVariable,
    ts.SymbolFlags.ExportValue,
    ts.SymbolFlags.TypeAlias,
    ts.SymbolFlags.Function,
    ts.SymbolFlags.Method,
    ts.SymbolFlags.Interface,
    ts.SymbolFlags.Property,
    ts.SymbolFlags.Class,
    ts.SymbolFlags.Constructor,
    ts.SymbolFlags.Alias,
    ts.SymbolFlags.GetAccessor,
    ts.SymbolFlags.SetAccessor,
    ts.SymbolFlags.ValueModule,
    ts.SymbolFlags.NamespaceModule,
];
// Sanity check, if this fails a dev messed up.
for (const key of Object.keys(symbolConverters)) {
    if (!Number.isInteger(Math.log2(+key))) {
        throw new Error(`Symbol converter for key ${ts.SymbolFlags[+key]} does not specify a valid flag value.`);
    }
    if (!conversionOrder.includes(+key)) {
        throw new Error(`Symbol converter for key ${ts.SymbolFlags[+key]} is not specified in conversionOrder`);
    }
}
if (conversionOrder.reduce((a, b) => a | b, 0) !== allConverterFlags) {
    throw new Error("conversionOrder contains a symbol flag that converters do not.");
}
function convertSymbol(context, symbol, exportSymbol) {
    if (context.shouldIgnore(symbol)) {
        return;
    }
    // This check can catch symbols which ought to be documented as references
    // but aren't aliased symbols because `export *` was used.
    const previous = context.project.getReflectionFromSymbol(symbol);
    if (previous &&
        previous.parent?.kindOf(models_1.ReflectionKind.Module | models_1.ReflectionKind.Project)) {
        createAlias(previous, context, symbol, exportSymbol);
        return;
    }
    let flags = (0, enum_1.removeFlag)(symbol.flags, ts.SymbolFlags.Transient |
        ts.SymbolFlags.Assignment |
        ts.SymbolFlags.Optional |
        ts.SymbolFlags.Prototype);
    // Declaration merging - the only type (excluding enum/enum, ns/ns, etc)
    // that TD supports is merging a class and interface. All others are
    // represented as multiple reflections
    if ((0, enum_1.hasAllFlags)(symbol.flags, ts.SymbolFlags.Class)) {
        flags = (0, enum_1.removeFlag)(flags, ts.SymbolFlags.Interface | ts.SymbolFlags.Function);
    }
    // Kind of declaration merging... we treat this as a property with get/set signatures.
    if ((0, enum_1.hasAllFlags)(symbol.flags, ts.SymbolFlags.GetAccessor)) {
        flags = (0, enum_1.removeFlag)(flags, ts.SymbolFlags.SetAccessor);
    }
    if ((0, enum_1.hasAllFlags)(symbol.flags, ts.SymbolFlags.NamespaceModule)) {
        // This might be here if a namespace is declared several times.
        flags = (0, enum_1.removeFlag)(flags, ts.SymbolFlags.ValueModule);
    }
    if ((0, enum_1.hasAnyFlag)(symbol.flags, ts.SymbolFlags.Method |
        ts.SymbolFlags.Interface |
        ts.SymbolFlags.Class |
        ts.SymbolFlags.Variable)) {
        // This happens when someone declares an object with methods:
        // { methodProperty() {} }
        flags = (0, enum_1.removeFlag)(flags, ts.SymbolFlags.Property);
    }
    // A default exported function with no associated variable is a property, but
    // we should really convert it as a variable for documentation purposes
    // export default () => {}
    // export default 123
    if (flags === ts.SymbolFlags.Property &&
        symbol.name === "default" &&
        context.scope.kindOf(models_1.ReflectionKind.Module | models_1.ReflectionKind.Project)) {
        flags = ts.SymbolFlags.BlockScopedVariable;
    }
    for (const flag of (0, enum_1.getEnumFlags)(flags ^ allConverterFlags)) {
        if (!(flag & allConverterFlags)) {
            context.logger.verbose(`Missing converter for symbol: ${symbol.name} with flag ${ts.SymbolFlags[flag]}`);
        }
    }
    // Note: This method does not allow skipping earlier converters.
    // For now, this is fine... might not be flexible enough in the future.
    let skip = 0;
    for (const flag of conversionOrder) {
        if (!(flag & flags))
            continue;
        if (skip & flag)
            continue;
        skip |= symbolConverters[flag]?.(context, symbol, exportSymbol) || 0;
    }
}
exports.convertSymbol = convertSymbol;
function convertSymbols(context, symbols) {
    for (const symbol of symbols) {
        convertSymbol(context, symbol);
    }
}
function convertEnum(context, symbol, exportSymbol) {
    const reflection = context.createDeclarationReflection(models_1.ReflectionKind.Enum, symbol, exportSymbol);
    if (symbol.flags & ts.SymbolFlags.ConstEnum) {
        reflection.setFlag(models_1.ReflectionFlag.Const);
    }
    context.finalizeDeclarationReflection(reflection);
    convertSymbols(context.withScope(reflection), context.checker
        .getExportsOfModule(symbol)
        .filter((s) => s.flags & ts.SymbolFlags.EnumMember));
}
function convertEnumMember(context, symbol, exportSymbol) {
    const reflection = context.createDeclarationReflection(models_1.ReflectionKind.EnumMember, symbol, exportSymbol);
    const defaultValue = context.checker.getConstantValue(symbol.getDeclarations()[0]);
    if (defaultValue !== undefined) {
        reflection.type = new models_1.LiteralType(defaultValue);
    }
    else {
        // We know this has to be a number, because computed values aren't allowed
        // in string enums, so otherwise we would have to have the constant value
        reflection.type = new models_1.IntrinsicType("number");
    }
    context.finalizeDeclarationReflection(reflection);
}
function convertNamespace(context, symbol, exportSymbol) {
    let exportFlags = ts.SymbolFlags.ModuleMember;
    // This can happen in JS land where "class" functions get tagged as a namespace too
    if (symbol
        .getDeclarations()
        ?.some((d) => ts.isModuleDeclaration(d) || ts.isSourceFile(d)) !==
        true) {
        exportFlags = ts.SymbolFlags.ClassMember;
        if ((0, enum_1.hasAnyFlag)(symbol.flags, ts.SymbolFlags.Class)) {
            return;
        }
    }
    const reflection = context.createDeclarationReflection(models_1.ReflectionKind.Namespace, symbol, exportSymbol);
    context.finalizeDeclarationReflection(reflection);
    convertSymbols(context.withScope(reflection), context.checker
        .getExportsOfModule(symbol)
        .filter((s) => s.flags & exportFlags));
}
function convertTypeAlias(context, symbol, exportSymbol) {
    const declaration = symbol
        ?.getDeclarations()
        ?.find((d) => ts.isTypeAliasDeclaration(d) ||
        ts.isJSDocTypedefTag(d) ||
        ts.isJSDocCallbackTag(d) ||
        ts.isJSDocEnumTag(d));
    assert(declaration);
    if (ts.isTypeAliasDeclaration(declaration)) {
        const reflection = context.createDeclarationReflection(models_1.ReflectionKind.TypeAlias, symbol, exportSymbol);
        reflection.type = context.converter.convertType(context.withScope(reflection), declaration.type);
        context.finalizeDeclarationReflection(reflection);
        // Do this after finalization so that the CommentPlugin can get @typeParam tags
        // from the parent comment. Ugly, but works for now. Should be cleaned up eventually.
        reflection.typeParameters = declaration.typeParameters?.map((param) => (0, signature_1.createTypeParamReflection)(param, context.withScope(reflection)));
    }
    else if (ts.isJSDocTypedefTag(declaration) ||
        ts.isJSDocEnumTag(declaration)) {
        (0, jsdoc_1.convertJsDocAlias)(context, symbol, declaration, exportSymbol);
    }
    else {
        (0, jsdoc_1.convertJsDocCallback)(context, symbol, declaration, exportSymbol);
    }
}
function convertFunctionOrMethod(context, symbol, exportSymbol) {
    // Can't just check method flag because this might be called for properties as well
    // This will *NOT* be called for variables that look like functions, they need a special case.
    const isMethod = !!(symbol.flags &
        (ts.SymbolFlags.Property | ts.SymbolFlags.Method));
    const declarations = symbol.getDeclarations()?.filter(ts.isFunctionLike) ?? [];
    // Don't do anything if we inherited this method and it is private.
    if (isMethod &&
        isInherited(context, symbol) &&
        declarations.length > 0 &&
        (0, enum_1.hasAllFlags)(ts.getCombinedModifierFlags(declarations[0]), ts.ModifierFlags.Private)) {
        return;
    }
    const parentSymbol = context.project.getSymbolFromReflection(context.scope);
    const locationDeclaration = parentSymbol
        ?.getDeclarations()
        ?.find((d) => ts.isClassDeclaration(d) || ts.isInterfaceDeclaration(d)) ??
        parentSymbol?.getDeclarations()?.[0]?.getSourceFile() ??
        symbol.getDeclarations()?.[0]?.getSourceFile();
    assert(locationDeclaration, "Missing declaration context");
    const type = context.checker.getTypeOfSymbolAtLocation(symbol, locationDeclaration);
    // Need to get the non nullable type because interface methods might be declared
    // with a question token. See GH1490.
    const signatures = type.getNonNullableType().getCallSignatures();
    const reflection = context.createDeclarationReflection(context.scope.kindOf(models_1.ReflectionKind.ClassOrInterface |
        models_1.ReflectionKind.VariableOrProperty |
        models_1.ReflectionKind.TypeLiteral)
        ? models_1.ReflectionKind.Method
        : models_1.ReflectionKind.Function, symbol, exportSymbol, void 0);
    if (symbol.declarations?.length && isMethod) {
        // All method signatures must have the same modifier flags.
        setModifiers(symbol, symbol.declarations[0], reflection);
    }
    context.finalizeDeclarationReflection(reflection);
    const scope = context.withScope(reflection);
    reflection.signatures ?? (reflection.signatures = []);
    // Can't use zip here. We might have less declarations than signatures
    // or less signatures than declarations.
    for (let i = 0; i < signatures.length; i++) {
        (0, signature_1.createSignature)(scope, models_1.ReflectionKind.CallSignature, signatures[i], declarations[i]);
    }
}
// getDeclaredTypeOfSymbol gets the INSTANCE type
// getTypeOfSymbolAtLocation gets the STATIC type
function convertClassOrInterface(context, symbol, exportSymbol) {
    const reflection = context.createDeclarationReflection(ts.SymbolFlags.Class & symbol.flags
        ? models_1.ReflectionKind.Class
        : models_1.ReflectionKind.Interface, symbol, exportSymbol, void 0);
    const classDeclaration = symbol
        .getDeclarations()
        ?.find((d) => ts.isClassDeclaration(d) || ts.isFunctionDeclaration(d));
    if (classDeclaration)
        setModifiers(symbol, classDeclaration, reflection);
    const reflectionContext = context.withScope(reflection);
    const instanceType = context.checker.getDeclaredTypeOfSymbol(symbol);
    assert(instanceType.isClassOrInterface());
    // We might do some inheritance - do this first so that it's set when converting properties
    const declarations = symbol
        .getDeclarations()
        ?.filter((d) => ts.isInterfaceDeclaration(d) || ts.isClassDeclaration(d)) ?? [];
    const extendedTypes = (0, nodes_1.getHeritageTypes)(declarations, ts.SyntaxKind.ExtendsKeyword).map((t) => context.converter.convertType(reflectionContext, t));
    if (extendedTypes.length) {
        reflection.extendedTypes = extendedTypes;
    }
    const implementedTypes = (0, nodes_1.getHeritageTypes)(declarations, ts.SyntaxKind.ImplementsKeyword).map((t) => context.converter.convertType(reflectionContext, t));
    if (implementedTypes.length) {
        reflection.implementedTypes = implementedTypes;
    }
    context.finalizeDeclarationReflection(reflection);
    if (classDeclaration) {
        // Classes can have static props
        const staticType = context.checker.getTypeOfSymbolAtLocation(symbol, classDeclaration);
        reflectionContext.shouldBeStatic = true;
        for (const prop of context.checker.getPropertiesOfType(staticType)) {
            // Don't convert namespace members, or the prototype here.
            if (prop.flags &
                (ts.SymbolFlags.ModuleMember | ts.SymbolFlags.Prototype))
                continue;
            convertSymbol(reflectionContext, prop);
        }
        reflectionContext.shouldBeStatic = false;
        const ctors = staticType.getConstructSignatures();
        const constructMember = reflectionContext.createDeclarationReflection(models_1.ReflectionKind.Constructor, ctors?.[0]?.declaration?.symbol, void 0, "constructor");
        // Modifiers are the same for all constructors
        if (ctors.length && ctors[0].declaration) {
            setModifiers(symbol, ctors[0].declaration, constructMember);
        }
        context.finalizeDeclarationReflection(constructMember);
        const constructContext = reflectionContext.withScope(constructMember);
        ctors.forEach((sig) => {
            (0, signature_1.createSignature)(constructContext, models_1.ReflectionKind.ConstructorSignature, sig);
        });
    }
    // Classes/interfaces usually just have properties...
    convertSymbols(reflectionContext, context.checker.getPropertiesOfType(instanceType));
    // And type arguments
    if (instanceType.typeParameters) {
        reflection.typeParameters = instanceType.typeParameters.map((param) => {
            const declaration = param.symbol?.declarations?.[0];
            assert(declaration && ts.isTypeParameterDeclaration(declaration));
            return (0, signature_1.createTypeParamReflection)(declaration, reflectionContext);
        });
    }
    // Interfaces might also have call signatures
    // Classes might too, because of declaration merging
    context.checker
        .getSignaturesOfType(instanceType, ts.SignatureKind.Call)
        .forEach((sig) => (0, signature_1.createSignature)(reflectionContext, models_1.ReflectionKind.CallSignature, sig));
    // We also might have constructor signatures
    // This is potentially a problem with classes having multiple "constructor" members...
    // but nobody has complained yet.
    convertConstructSignatures(reflectionContext, symbol);
    // And finally, index signatures
    (0, index_signature_1.convertIndexSignature)(reflectionContext, symbol);
}
function convertProperty(context, symbol, exportSymbol) {
    const declarations = symbol.getDeclarations() ?? [];
    // Don't do anything if we inherited this property and it is private.
    if (isInherited(context, symbol) &&
        declarations.length > 0 &&
        (0, enum_1.hasAllFlags)(ts.getCombinedModifierFlags(declarations[0]), ts.ModifierFlags.Private)) {
        return;
    }
    // Special case: We pretend properties are methods if they look like methods.
    // This happens with mixins / weird inheritance.
    if (declarations.length &&
        declarations.every((decl) => ts.isMethodSignature(decl) || ts.isMethodDeclaration(decl))) {
        return convertFunctionOrMethod(context, symbol, exportSymbol);
    }
    if (declarations.length === 1) {
        const declaration = declarations[0];
        // Special case: "arrow methods" should be treated as methods.
        if (ts.isPropertyDeclaration(declaration) &&
            !declaration.type &&
            declaration.initializer &&
            ts.isArrowFunction(declaration.initializer)) {
            return convertArrowAsMethod(context, symbol, declaration.initializer, exportSymbol);
        }
    }
    const reflection = context.createDeclarationReflection(context.scope.kindOf(models_1.ReflectionKind.Namespace)
        ? models_1.ReflectionKind.Variable
        : models_1.ReflectionKind.Property, symbol, exportSymbol);
    const declaration = symbol.getDeclarations()?.[0];
    let parameterType;
    if (declaration &&
        (ts.isPropertyDeclaration(declaration) ||
            ts.isPropertySignature(declaration) ||
            ts.isParameter(declaration) ||
            ts.isPropertyAccessExpression(declaration))) {
        if (!ts.isPropertyAccessExpression(declaration)) {
            parameterType = declaration.type;
        }
        setModifiers(symbol, declaration, reflection);
    }
    reflection.defaultValue = declaration && (0, convert_expression_1.convertDefaultValue)(declaration);
    reflection.type = context.converter.convertType(context, (context.isConvertingTypeNode() ? parameterType : void 0) ??
        context.checker.getTypeOfSymbol(symbol));
    if (reflection.flags.isOptional) {
        reflection.type = (0, reflections_1.removeUndefined)(reflection.type);
    }
    context.finalizeDeclarationReflection(reflection);
}
function convertArrowAsMethod(context, symbol, arrow, exportSymbol) {
    const reflection = context.createDeclarationReflection(models_1.ReflectionKind.Method, symbol, exportSymbol, void 0);
    setModifiers(symbol, arrow.parent, reflection);
    context.finalizeDeclarationReflection(reflection);
    const rc = context.withScope(reflection);
    const signature = context.checker.getSignatureFromDeclaration(arrow);
    assert(signature);
    (0, signature_1.createSignature)(rc, models_1.ReflectionKind.CallSignature, signature, arrow);
}
function convertConstructor(context, symbol) {
    const reflection = context.createDeclarationReflection(models_1.ReflectionKind.Constructor, symbol, void 0, "constructor");
    context.finalizeDeclarationReflection(reflection);
    const reflectionContext = context.withScope(reflection);
    const declarations = symbol.getDeclarations()?.filter(ts.isConstructorDeclaration) ?? [];
    const signatures = declarations.map((decl) => {
        const sig = context.checker.getSignatureFromDeclaration(decl);
        assert(sig);
        return sig;
    });
    for (const sig of signatures) {
        (0, signature_1.createSignature)(reflectionContext, models_1.ReflectionKind.ConstructorSignature, sig);
    }
}
function convertConstructSignatures(context, symbol) {
    const type = context.checker.getDeclaredTypeOfSymbol(symbol);
    // These get added as a "constructor" member of this interface. This is a problem... but nobody
    // has complained yet. We really ought to have a constructSignatures property on the reflection instead.
    const constructSignatures = context.checker.getSignaturesOfType(type, ts.SignatureKind.Construct);
    if (constructSignatures.length) {
        const constructMember = new models_1.DeclarationReflection("constructor", models_1.ReflectionKind.Constructor, context.scope);
        context.postReflectionCreation(constructMember, symbol, void 0);
        context.finalizeDeclarationReflection(constructMember);
        const constructContext = context.withScope(constructMember);
        constructSignatures.forEach((sig) => (0, signature_1.createSignature)(constructContext, models_1.ReflectionKind.ConstructorSignature, sig));
    }
}
function convertAlias(context, symbol, exportSymbol) {
    const reflection = context.project.getReflectionFromSymbol(context.resolveAliasedSymbol(symbol));
    if (!reflection) {
        // We don't have this, convert it.
        convertSymbol(context, context.resolveAliasedSymbol(symbol), exportSymbol ?? symbol);
    }
    else {
        createAlias(reflection, context, symbol, exportSymbol);
    }
}
function createAlias(target, context, symbol, exportSymbol) {
    // We already have this. Create a reference.
    const ref = new models_1.ReferenceReflection(exportSymbol?.name ?? symbol.name, target, context.scope);
    context.postReflectionCreation(ref, symbol, exportSymbol);
    context.finalizeDeclarationReflection(ref);
}
function convertVariable(context, symbol, exportSymbol) {
    const declaration = symbol.getDeclarations()?.[0];
    assert(declaration);
    const type = context.checker.getTypeOfSymbolAtLocation(symbol, declaration);
    if (isEnumLike(context.checker, type, declaration) &&
        symbol.getJsDocTags().some((tag) => tag.name === "enum")) {
        return convertVariableAsEnum(context, symbol, exportSymbol);
    }
    if (type.getCallSignatures().length) {
        return convertVariableAsFunction(context, symbol, exportSymbol);
    }
    const reflection = context.createDeclarationReflection(models_1.ReflectionKind.Variable, symbol, exportSymbol);
    let typeNode;
    if (ts.isVariableDeclaration(declaration)) {
        // Otherwise we might have destructuring
        typeNode = declaration.type;
    }
    reflection.type = context.converter.convertType(context.withScope(reflection), typeNode ?? type);
    setModifiers(symbol, declaration, reflection);
    reflection.defaultValue = (0, convert_expression_1.convertDefaultValue)(declaration);
    context.finalizeDeclarationReflection(reflection);
    return ts.SymbolFlags.Property;
}
function isEnumLike(checker, type, location) {
    if (!(0, enum_1.hasAllFlags)(type.flags, ts.TypeFlags.Object)) {
        return false;
    }
    return type.getProperties().every((prop) => {
        const propType = checker.getTypeOfSymbolAtLocation(prop, location);
        return isValidEnumProperty(propType);
    });
}
function isValidEnumProperty(type) {
    return (0, enum_1.hasAnyFlag)(type.flags, ts.TypeFlags.NumberLike | ts.TypeFlags.StringLike);
}
function convertVariableAsEnum(context, symbol, exportSymbol) {
    const reflection = context.createDeclarationReflection(models_1.ReflectionKind.Enum, symbol, exportSymbol);
    context.finalizeDeclarationReflection(reflection);
    const rc = context.withScope(reflection);
    const declaration = symbol.declarations[0];
    const type = context.checker.getTypeAtLocation(declaration);
    for (const prop of type.getProperties()) {
        const reflection = rc.createDeclarationReflection(models_1.ReflectionKind.EnumMember, prop, void 0);
        const propType = context.checker.getTypeOfSymbolAtLocation(prop, declaration);
        reflection.type = context.converter.convertType(context, propType);
        rc.finalizeDeclarationReflection(reflection);
    }
    // Skip converting the type alias, if there is one
    return ts.SymbolFlags.TypeAlias;
}
function convertVariableAsFunction(context, symbol, exportSymbol) {
    const declaration = symbol
        .getDeclarations()
        ?.find(ts.isVariableDeclaration);
    const accessDeclaration = declaration ?? symbol.valueDeclaration;
    const type = accessDeclaration
        ? context.checker.getTypeOfSymbolAtLocation(symbol, accessDeclaration)
        : context.checker.getDeclaredTypeOfSymbol(symbol);
    const reflection = context.createDeclarationReflection(models_1.ReflectionKind.Function, symbol, exportSymbol);
    setModifiers(symbol, accessDeclaration, reflection);
    reflection.conversionFlags |= models_1.ConversionFlags.VariableSource;
    context.finalizeDeclarationReflection(reflection);
    const reflectionContext = context.withScope(reflection);
    reflection.signatures ?? (reflection.signatures = []);
    for (const signature of type.getCallSignatures()) {
        (0, signature_1.createSignature)(reflectionContext, models_1.ReflectionKind.CallSignature, signature);
    }
    return ts.SymbolFlags.Property;
}
function convertAccessor(context, symbol, exportSymbol) {
    const reflection = context.createDeclarationReflection(models_1.ReflectionKind.Accessor, symbol, exportSymbol);
    const rc = context.withScope(reflection);
    const declaration = symbol.getDeclarations()?.[0];
    if (declaration) {
        setModifiers(symbol, declaration, reflection);
    }
    context.finalizeDeclarationReflection(reflection);
    const getDeclaration = symbol.getDeclarations()?.find(ts.isGetAccessor);
    if (getDeclaration) {
        const signature = context.checker.getSignatureFromDeclaration(getDeclaration);
        if (signature) {
            (0, signature_1.createSignature)(rc, models_1.ReflectionKind.GetSignature, signature, getDeclaration);
        }
    }
    const setDeclaration = symbol.getDeclarations()?.find(ts.isSetAccessor);
    if (setDeclaration) {
        const signature = context.checker.getSignatureFromDeclaration(setDeclaration);
        if (signature) {
            (0, signature_1.createSignature)(rc, models_1.ReflectionKind.SetSignature, signature, setDeclaration);
        }
    }
}
function isInherited(context, symbol) {
    const parentSymbol = context.project.getSymbolFromReflection(context.scope);
    assert(parentSymbol, `No parent symbol found for ${symbol.name} in ${context.scope.name}`);
    const parents = parentSymbol.declarations?.slice() || [];
    const constructorDecls = parents.flatMap((parent) => ts.isClassDeclaration(parent)
        ? parent.members.filter(ts.isConstructorDeclaration)
        : []);
    parents.push(...constructorDecls);
    return (parents.some((d) => symbol.getDeclarations()?.some((d2) => d2.parent === d)) === false);
}
function setModifiers(symbol, declaration, reflection) {
    if (!declaration) {
        return;
    }
    const modifiers = ts.getCombinedModifierFlags(declaration);
    if (ts.isMethodDeclaration(declaration) ||
        ts.isPropertyDeclaration(declaration) ||
        ts.isAccessor(declaration)) {
        if (ts.isPrivateIdentifier(declaration.name)) {
            reflection.setFlag(models_1.ReflectionFlag.Private);
        }
    }
    if ((0, enum_1.hasAllFlags)(modifiers, ts.ModifierFlags.Private)) {
        reflection.setFlag(models_1.ReflectionFlag.Private);
    }
    if ((0, enum_1.hasAllFlags)(modifiers, ts.ModifierFlags.Protected)) {
        reflection.setFlag(models_1.ReflectionFlag.Protected);
    }
    if ((0, enum_1.hasAllFlags)(modifiers, ts.ModifierFlags.Public)) {
        reflection.setFlag(models_1.ReflectionFlag.Public);
    }
    reflection.setFlag(models_1.ReflectionFlag.Optional, (0, enum_1.hasAllFlags)(symbol.flags, ts.SymbolFlags.Optional));
    reflection.setFlag(models_1.ReflectionFlag.Readonly, (0, enum_1.hasAllFlags)(symbol.checkFlags ?? 0, ts.CheckFlags.Readonly) ||
        (0, enum_1.hasAllFlags)(modifiers, ts.ModifierFlags.Readonly));
    reflection.setFlag(models_1.ReflectionFlag.Abstract, (0, enum_1.hasAllFlags)(modifiers, ts.ModifierFlags.Abstract));
    if (reflection.kindOf(models_1.ReflectionKind.Variable) &&
        (0, enum_1.hasAllFlags)(symbol.flags, ts.SymbolFlags.BlockScopedVariable)) {
        reflection.setFlag(models_1.ReflectionFlag.Const, (0, enum_1.hasAllFlags)(declaration.parent.flags, ts.NodeFlags.Const));
    }
    // ReflectionFlag.Static happens when constructing the reflection.
    // We don't have sufficient information here to determine if it ought to be static.
}
