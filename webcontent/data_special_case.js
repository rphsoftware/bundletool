import { compare } from "./e/index.mjs";
import { readEncryptedGameFile } from "./transformers.js";
const fs = window.parent.require('fs');
const path = window.parent.require('path');

export function normalizeSystemjsonTree(tree) {
    tree.hasEncryptedAudio = true;
    tree.hasEncryptedImages = true;
    tree.versionId = 0;
    tree.editMapId = 0;
    return tree;
}

export function normalizeMapInfosTree(tree) {
    for (let a of tree) {
        if (a) {
            a.scrollX = 0;
            a.scrollY = 0;
            a.expanded = true;
        }
    }
    return tree;
}

export async function performSpecialCase(jobFiles, playtestBase, gameBase) {
    if (jobFiles.inGameChanged.includes("data/System.json")) {
        // Special-case system.json ("enables" encryption and resets the version id and edit map id since those vary and have no effect.)

        let inGameData = readEncryptedGameFile(gameBase, "data/System.json", "utf-8");
        let platstData = fs.readFileSync(path.join(playtestBase, "data/System.json"), "utf-8");

        inGameData = normalizeSystemjsonTree(JSON.parse(inGameData));
        platstData = normalizeSystemjsonTree(JSON.parse(platstData));

        if (compare(inGameData, platstData).length === 0) {
            jobFiles.inGameChanged = jobFiles.inGameChanged.filter(a => a !== "data/System.json");
        }
    }

    if (jobFiles.inGameChanged.includes("data/MapInfos.json")) {
        // Special-case mapInfos.json (undos scrolling which is fucky anyway)

        let inGameData = readEncryptedGameFile(gameBase, "data/MapInfos.json", "utf-8");
        let platstData = fs.readFileSync(path.join(playtestBase, "data/MapInfos.json"), "utf-8");

        inGameData = normalizeMapInfosTree(JSON.parse(inGameData));
        platstData = normalizeMapInfosTree(JSON.parse(platstData));

        if (compare(inGameData, platstData).length === 0) {
            jobFiles.inGameChanged = jobFiles.inGameChanged.filter(a => a !== "data/MapInfos.json");
        }
    }


    return jobFiles;
}