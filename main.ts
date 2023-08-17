#!/usr/bin/env -S deno run -A
import * as core from "npm:@actions/core"
import { readFile, writeFile } from "node:fs/promises"
import process from "node:process"
import { glob } from "npm:glob"

const path = core.getInput("path")
process.chdir(path)

const features = await Promise.all(
  (await glob("src/*/devcontainer-feature.json")).map(f =>
    readFile(f, "utf8")
      .then(x => JSON.parse(x))
    )
)
core.setOutput("features", JSON.stringify(features))

// These are the CHANGED files.
// https://github.com/dorny/paths-filter
const srcFiles = JSON.parse(process.env.PATHS_FILTER_OUTPUTS_SRC_FILES)
const testFiles = JSON.parse(process.env.PATHS_FILTER_OUTPUTS_TEST_FILES)
console.dir(srcFiles)
console.dir(testFiles)

const changedFeatureIds = [
  // These paths are from BEFORE the 'process.chdir()'
  ...srcFiles.map(x => x.match(/src\/(.*?)\//)[1]).filter(x => x),
  ...testFiles.map(x => x.match(/test\/(.*?)\//)[1]).filter(x => x),
]
const changedFeatures = (await Promise.all(
  changedFeatureIds.map(id =>
    readFile(`src/${id}/devcontainer-feature.json`, "utf8")
      .then(x => JSON.parse(x))
      .catch(() => {})
  )
)).filter(x => x)
core.setOutput("changed-features", JSON.stringify(changedFeatures))
