import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [sveltekit()],
    test: {
        include: ["src/**/*.{test,spec}.{js,ts}"],
        globals: true,
        environment: "jsdom",
        clearMocks: true,
        setupFiles: ["src/setuptest.ts"],
    },
    optimizeDeps: {
        include: ["@api-subventions-asso/dto"],
    },
    build: {
        commonjsOptions: {
            include: [/dto/, /node_modules/],
        },
    },
});
