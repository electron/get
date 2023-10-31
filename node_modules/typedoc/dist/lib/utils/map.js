"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultMap = void 0;
class DefaultMap extends Map {
    constructor(creator) {
        super();
        this.creator = creator;
    }
    get(key) {
        const saved = super.get(key);
        if (saved != null) {
            return saved;
        }
        const created = this.creator();
        this.set(key, created);
        return created;
    }
}
exports.DefaultMap = DefaultMap;
