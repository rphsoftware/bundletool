// This file is a special one

import { lastSpecialMode, recursiveReaddir, setLastSpecialMode } from "./readdir.js";
import { dewindowsLineEndings, readEncryptedGameFile, transformFilenameForEncrypted } from "./transformers.js";
import { setJobTitle, setProgressBar, setSubtitle } from "./ui.js";
import { forceYield, maybeYield } from "./yielder.js";

const fs = window.parent.require('fs');
const path = window.parent.require('path').posix;
const os = window.parent.require('os');

// Helper to process items concurrently with a limit
async function processConcurrently(items, batchSize, processor) {
    const results = new Array(items.length);
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map((item, idx) => 
            processor(item, i + idx)
        ));
        batchResults.forEach((result, idx) => {
            results[i + idx] = result;
        });
    }
    return results;
}

// Determine optimal batch size based on CPU count
function getOptimalBatchSize() {
    const cpuCount = os.cpus().length;
    return Math.min(cpuCount, 8);
}

export async function runComparison(cmpPaths, gameBase, playtestBase) {
    const tmpBase = path.join(gameBase, "..", ".bundletool_temporary");
    fs.mkdirSync(tmpBase);
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

    playtestFiles = playtestFiles.filter(a => {
        return (a !== "img/system/Loading.png" && a !== "img/system/Window.png" && a !== "languages/en/donottouch.xlsx" && a !== "languages/jp/donottouch.xlsx");
    });
    
    const BATCH_SIZE = getOptimalBatchSize();
    let playtestHashes = {};
    let done = 0;

    await processConcurrently(playtestFiles, BATCH_SIZE, async (a, index) => {
        let data = fs.readFileSync(path.join(playtestBase, a));
        data = dewindowsLineEndings(a, data);
        
        let buff = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);

        let digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", buff))).map(b=>b.toString(16).padStart(2, '0')).join('');
        
        playtestHashes[a] = digest;
        
        done++;
        setProgressBar(done, playtestFiles.length);
    });

    setSubtitle("Finding files that exist in the game");
    
    done = 0;
    let isInGame = [];
    let completelyNew = [];

    await processConcurrently(playtestFiles, BATCH_SIZE, async (a, index) => {
        if (fs.existsSync(path.join(gameBase, transformFilenameForEncrypted(a)))) {
            isInGame.push(a);
        } else {
            completelyNew.push(a);
        }

        done++;
        setProgressBar(done, playtestFiles.length);
    });

    let inGameChanged = [];
    
    done = 0;
    setSubtitle("Hashing in-game files...");
    
    await processConcurrently(isInGame, BATCH_SIZE, async (a, index) => {
        let d = readEncryptedGameFile(gameBase, a);
        d = dewindowsLineEndings(a, d, gameBase);
        if (Buffer.isBuffer(d)) {
            d = d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength);
        }
        let digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", d))).map(b=>b.toString(16).padStart(2, '0')).join('');
        if (playtestHashes[a] !== digest) {
            inGameChanged.push(a);
        }

        done++;
        setProgressBar(done, isInGame.length);
    });

    return { inGameChanged, completelyNew };
}