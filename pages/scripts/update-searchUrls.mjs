import fs from 'fs'
import Commands from '../src/data/commands.json' assert { type: 'json' }

const urls = Commands.map((cmd) => cmd.searchUrl)
fs.writeFileSync('./public/data/searchUrls.json', JSON.stringify(urls, null, 2))
