"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.anchorIcon = void 0;
const utils_1 = require("../../../../utils");
const anchorIcon = (context, anchor) => (utils_1.JSX.createElement("a", { href: `#${anchor}`, "aria-label": "Permalink", class: "tsd-anchor-icon" }, context.icons.anchor()));
exports.anchorIcon = anchorIcon;
