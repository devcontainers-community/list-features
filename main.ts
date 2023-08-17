#!/usr/bin/env -S deno run -A
import * as core from "npm:@actions/core"
import { readFile, writeFile } from "node:fs/promises"
import process from "node:process"
import { glob } from "npm:glob"
import { $ } from "npm:zx"

const path = core.getInput("path")
process.chdir(path)
$.cwd = process.cwd()

const features = await Promise.all(
  (await glob("src/*/devcontainer-feature.json")).map(f =>
    readFile(f, "utf8")
      .then(x => JSON.parse(x))
    )
)
core.setOutput("features", JSON.stringify(features))

const ref = core.getInput("ref")
const event = JSON.parse(process.env.GITHUB_EVENT)
let changedFeatures;
if (event.pull_request) {
  const baseRef = event.pull_request.base.ref
  const changedFiles = (await $`git diff --name-only ${baseRef} ${ref}`).toString().split(/\r?\n/g)
  const changedIds = changedFiles.map(x => /src\/(.*?)\//.match(x)?.[1]).filter(x => x)
  changedFeatures = (await Promise.all(
    changedIds.map(x => readFile(`src/${id}/devcontainer-feature.json`, "utf8")
      .catch(() => {}))
  ))
    .filter(x => x)
    .map(x => {
      try {
        return JSON.parse(x)
      } catch {}
    })
    .filter(x => x)
} else {
  changedFeatures = []
}
core.setOutput("changed-features", JSON.stringify(changedFeatures))
