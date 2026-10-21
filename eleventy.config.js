// Baut aus den Dateien in src/ die fertige Website in _site/.
import { HtmlBasePlugin } from "@11ty/eleventy";
const MONATE = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

export default function (eleventyConfig) {
  // Passt alle Links an, wenn die Seite unter einem Unterpfad liegt (z. B. vorläufig auf github.io).
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });
  eleventyConfig.addPassthroughCopy({ "src/CNAME": "CNAME" });
  eleventyConfig.addPassthroughCopy({ "src/.nojekyll": ".nojekyll" });

  eleventyConfig.addCollection("posts", (api) =>
    api.getFilteredByGlob("src/posts/*.md")
      .filter((p) => !p.data.entwurf)
      .sort((a, b) => b.date - a.date)
  );

  eleventyConfig.addFilter("datumLang", (d) => {
    const x = new Date(d);
    return `${x.getDate()}. ${MONATE[x.getMonth()]} ${x.getFullYear()}`;
  });
  eleventyConfig.addFilter("datumKurz", (d) => {
    const x = new Date(d);
    const p = (n) => String(n).padStart(2, "0");
    return `${p(x.getDate())}.${p(x.getMonth() + 1)}.${x.getFullYear()}`;
  });
  eleventyConfig.addFilter("datumISO", (d) => new Date(d).toISOString());
  eleventyConfig.addFilter("limit", (arr, n) => arr.slice(0, n));
  eleventyConfig.addFilter("ohneDatum", (slug) => String(slug).replace(/^\d{4}-\d{2}-\d{2}-/, ""));
  eleventyConfig.addFilter("jahr", () => new Date().getFullYear());

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
