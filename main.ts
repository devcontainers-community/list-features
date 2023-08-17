#!/usr/bin/env -S deno run -A
import * as core from "npm:@actions/core";
import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";
import { glob } from "npm:glob";
import { $ } from "npm:zx";

const path = core.getInput("path");
process.chdir(path);
$.cwd = process.cwd();

const allFeatures = await Promise.all(
  (
    await glob("src/*/devcontainer-feature.json")
  ).map((f) => readFile(f, "utf8").then((x) => JSON.parse(x)))
);
console.log("all-features", features)
core.setOutput("all-features", JSON.stringify(allFeatures));

const eventName = process.env.GITHUB_EVENT_NAME;
const event = JSON.parse(process.env.GITHUB_EVENT);
console.log("event", event);

// BEFORE
let baseRef = core.getInput("base_ref");
if (!baseRef) {
  if (eventName === "push") {
    baseRef = event.before;
  } else if (eventName === "pull_request") {
    baseRef = event.pull_request.base.sha;
  }
}
console.log("before", baseRef);

// AFTER
let ref = core.getInput("ref");
if (!ref) {
  if (eventName === "push") {
    ref = event.after;
  } else if (eventName === "pull_request") {
    ref = event.pull_request.head.sha;
  }
}
console.log("after", ref);

let changedFeatures: any[];
if (baseRef) {
  const changedFiles = (await $`git diff --name-only ${baseRef} ${ref}`)
    .toString()
    .trim()
    .split(/\r?\n/g);
  console.log(changedFiles);

  const changedIds = [...new Set(changedFiles
    .map((x) => x.match(/src\/(.*?)\//)?.[1])
    .filter((x) => x))];

  changedFeatures = (
    await Promise.all(
      changedIds.map((x) =>
        readFile(`src/${x}/devcontainer-feature.json`, "utf8").catch(() => {})
      )
    )
  )
    .filter((x) => x)
    .map((x) => {
      try {
        return JSON.parse(x);
      } catch {}
    })
    .filter((x) => x);
} else {
  changedFeatures = [];
}
console.log("changed-features", changedFeatures);
core.setOutput("changed-features", JSON.stringify(changedFeatures));

if (changedFeatures.length) {
  core.setOutput("relevant-features", JSON.stringify(changedFeatures))
} else {
  core.setOutput("relevant-features", JSON.stringify(features))
}
