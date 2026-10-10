import { defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    name: "discord-colors",
    compatibilityDate: "2026-10-10",
    domains: ["dc.glare.dev"],
    "assets": {
      "notFoundHandling": "single-page-application"
    }
  }
});
