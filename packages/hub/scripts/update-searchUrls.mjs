import fs from "fs"
import Commands from "../src/data/commands.json" with { type: "json" }

const urls = Commands.map((cmd) => cmd.searchUrl).filter((url) => url != null)
fs.writeFileSync("./public/data/searchUrls.json", JSON.stringify(urls, null, 2))

const PAGE_ACTION = "pageAction"
const pageActionIds = Commands.filter(
  (cmd) => cmd.openMode === PAGE_ACTION,
).map((cmd) => cmd.id)
fs.writeFileSync(
  "./public/data/pageActionIds.json",
  JSON.stringify(pageActionIds, null, 2),
)
