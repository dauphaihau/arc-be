"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = require("node:path");
const config_1 = require("vitest/config");
exports.default = (0, config_1.defineConfig)({
    test: {
        globals: true,
    },
    resolve: {
        alias: [
            { find: '@', replacement: (0, node_path_1.resolve)(__dirname, './src') },
            { find: '@test', replacement: (0, node_path_1.resolve)(__dirname, './tests') },
        ],
    },
});
//# sourceMappingURL=vitest.config.js.map