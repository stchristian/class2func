#!/usr/bin/env node
import yargs from "yargs/yargs";
//@ts-ignore
import { hideBin } from "yargs/helpers";
import fs from "fs";
import path from "path";
import { transform } from "./transformer";

yargs(hideBin(process.argv))
  .scriptName("class2func")
  .command(
    "$0 [options] <files...>",
    "Transpile javascript files containing class based components",
    (yargs) =>
      yargs
        .positional("files", {
          describe: "files you want to transpile",
          array: true,
          type: "string",
        })
        .demandOption("files")
        .boolean("spread-state")
        .describe(
          "spread-state",
          "use spread state if your state is an object and you want to use different useState() calls to the keys of that object"
        ),
    (argv) => {
      console.log(argv);
      transformFiles(argv.files, {
        spreadState: argv["spread-state"],
      });
    }
  )
  .help().argv;

function transformFiles(
  files: string[],
  options: {
    spreadState?: boolean;
  }
) {
  for (const file of files) {
    fs.readFile(file, "utf8", (err, sourceText) => {
      if (err) {
        console.error(err);
        return;
      }
      const result = transform(path.basename(file), sourceText, options);
      const pathToWrite = path.join(path.dirname(file), `${path.basename(file, ".js")}.functional.js`);
      fs.writeFile(pathToWrite, result, () => {
        console.log(`${file} compiled`);
      });
    });
  }
}
