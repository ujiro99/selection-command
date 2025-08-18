import fs from "fs"
import Commands from "../src/data/commands.json" with { type: "json" }

const tags = Commands.map((command) => command.tags)
  .flat()
  .reduce((acc, tag) => {
    const f = acc.find((t) => t.name === tag)
    if (f) {
      f.count++
    } else {
      acc.push({ name: tag, count: 1 })
    }
    return acc
  }, [])

fs.writeFileSync("./src/data/tags.json", JSON.stringify(tags, null, 2))
