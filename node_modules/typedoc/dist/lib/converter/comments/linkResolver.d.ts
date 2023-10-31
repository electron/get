import { Comment, CommentDisplayPart, Reflection } from "../../models";
import type { Logger, ValidationOptions } from "../../utils";
import { DeclarationReference } from "./declarationReference";
export declare function resolveLinks(comment: Comment, reflection: Reflection, validation: ValidationOptions, logger: Logger, attemptExternalResolve: (ref: DeclarationReference) => string | undefined): void;
export declare function resolvePartLinks(reflection: Reflection, parts: readonly CommentDisplayPart[], warn: () => void, validation: ValidationOptions, logger: Logger, attemptExternalResolve: (ref: DeclarationReference) => string | undefined): CommentDisplayPart[];
