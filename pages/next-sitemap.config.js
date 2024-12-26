/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://ujiro99.github.io/selection-command', // Replace with your site's URL
  outDir: './out',
  generateRobotsTxt: true, // Optionally generate robots.txt
  transform: async (config, path) => {
    return {
      loc: encodeURI(path), // Encode URLs to handle Japanese characters
    }
  },
}
