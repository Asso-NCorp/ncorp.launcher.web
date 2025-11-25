import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
    input: `${process.env.PUBLIC_BACKEND_API_URL}/swagger/v1/swagger.json`,
    output: "src/lib/backend",
});
