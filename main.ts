#!/usr/bin/env -S deno run -A
import * as core from "npm:@actions/core"
import { readFile, writeFile } from "node:fs/promises"
import process from "node:process"
import { glob } from "npm:glob"

const features = await Promise.all(
  (await glob("src/*/devcontainer-feature.json")).map(f => readFile(f, "utf8"))
)
core.setOutput("features", JSON.stringify(features))

// These are the CHANGED files.
// https://github.com/dorny/paths-filter
const { src_files, test_files } = JSON.parse(process.env.PATHS_FILTER_OUTPUTS)

const changedFeatureIds = [
  ...src_files.map(x => x.match(/src\/(.*?)\//)[1]).filter(x => x),
  ...test_files.map(x => x.match(/test\/(.*?)\//)[1]).filter(x => x),
]
const changedFeatures = (await Promise.all(
  changedFeatureIds.map(id =>
    readFile(`src/${id}/devcontainer-feature.json`, "utf8")
      .then(x => JSON.parse(x))
      .catch(() => {})
  )
)).filter(x => x)
core.setOutput("changed-features", JSON.stringify(changedFeatures))
