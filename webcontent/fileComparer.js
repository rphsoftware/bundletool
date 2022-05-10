// This file is a special one

import { lastSpecialMode, recursiveReaddir, setLastSpecialMode } from "./readdir.js";
import { readEncryptedGameFile, transformFilenameForEncrypted } from "./transformers.js";
import { setJobTitle, setProgressBar, setSubtitle } from "./ui.js";
import { forceYield, maybeYield } from "./yielder.js";

const fs = window.parent.require('fs');
const path = window.parent.require('path').posix;

export async function runComparison(cmpPaths, gameBase, playtestBase) {
    setJobTitle("Comparing files");
    setSubtitle("Reading folder");
    setProgressBar(0, 1);
    await forceYield();

    let playtestFiles = [];
    setLastSpecialMode(1);
    for (let p of cmpPaths) {
        playtestFiles.push(...([...await recursiveReaddir(
            path.join(playtestBase, p),
            1
        )].map(a=>path.join(p, a))));
    }

    setLastSpecialMode(1);
    
    setSubtitle("Hashing playtest files");
    setProgressBar(0, playtestFiles.length);

    let playtestHashes = {};
    let done = 0;

    playtestFiles = playtestFiles.filter(a => {
        return (a !== "img/system/Loading.png" && a !== "img/system/Window.png" && a !== "languages/en/donottouch.xlsx");
    });
    for (let a of playtestFiles) {
        let data = fs.readFileSync(path.join(playtestBase, a));
        let buff = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);

        let digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", buff))).map(b=>b.toString(16).padStart(2, '0')).join('');
        done++;
        setProgressBar(done, playtestFiles.length);

        playtestHashes[a] = digest;
    }

    setSubtitle("Finding files that exist in the game");

    let isInGame = [];
    let completelyNew = [];
    done = 0;
    for (let a of playtestFiles) {
        if (fs.existsSync(path.join(gameBase, transformFilenameForEncrypted(a)))) {
            isInGame.push(a);
        } else {
            completelyNew.push(a);
        }

        setProgressBar(done, playtestFiles.length);
        done++;
        await maybeYield();
    }

    let inGameChanged = [];
    
    done = 0;
    setSubtitle("Hashing in-game files...");
    for (let a of isInGame) {
        let d = readEncryptedGameFile(gameBase, a);
        let digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", d))).map(b=>b.toString(16).padStart(2, '0')).join('');

        if (playtestHashes[a] !== digest) {
            inGameChanged.push(a);
        }

        setProgressBar(done, isInGame.length);
        done++;
        await maybeYield();
    }

    return { inGameChanged, completelyNew };
}