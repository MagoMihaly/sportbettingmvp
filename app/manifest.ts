import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "European Hockey Signal Engine",
    short_name: "EHSE",
    description: "Live hockey alert workspace for tracked leagues, signals and push-ready alerts.",
    start_url: "/",
    display: "standalone",
    background_color: "#050816",
    theme_color: "#050816",
    icons: [],
  };
}
