#!/usr/bin/env node
import yargs from "yargs/yargs";
//@ts-ignore
import { hideBin } from "yargs/helpers";
import fs from "fs";
import path from "path";
import { transform } from "./transformer";

yargs(hideBin(process.argv))
  .command(
    "$0 <files...>",
    "Transpile javascript files containing class based components",
    (yargs) =>
      yargs
        .positional("files", {
          describe: "files you want to transpile",
          array: true,
          type: "string",
        })
        .demandOption("files"),
    (argv) => {
      transformFiles(argv.files);
    }
  )
  .help().argv;

function transformFiles(files: string[]) {
  for (const file of files) {
    fs.readFile(file, "utf8", (err, sourceText) => {
      if (err) {
        console.error(err);
        return;
      }
      const result = transform(path.basename(file), sourceText);
      const pathToWrite = path.join(path.dirname(file), `${path.basename(file, ".js")}.functional.js`);
      fs.writeFile(pathToWrite, result, () => {
        console.log(`${file} compiled`);
      });
    });
  }
}
