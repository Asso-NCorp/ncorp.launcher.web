import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
    input: "https://dev-server.n-lan.com:3213/swagger/v1/swagger.json",
    output: "src/lib/backend",
});
