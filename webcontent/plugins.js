// This file is kinda special
// Not as special as fileComparer, but not as lame as icon
// good job

import { setJobTitle, setProgressBar, setSubtitle } from "./ui.js";
import { forceYield, maybeYield } from "./yielder.js";
import { compare } from "./e/index.mjs";
import { readEncryptedGameFile, transformFilenameForEncrypted } from "./transformers.js"

const fs = window.parent.require('fs');
const path = window.parent.require('path');
export async function comparePlugins(gameBase, playtestBase) {
    setJobTitle("Comparing plugins");
    setSubtitle("");
    setProgressBar(0, 1);
    await forceYield();

    let data = fs.readFileSync(path.join(gameBase, "js/plugins.js"), "utf-8");
    let x = eval(`${data.split("\nvar $plugins =\n")[1]}`);
    let baseGame = x;
    data = fs.readFileSync(path.join(playtestBase, "js/plugins.js"), "utf-8");
    x = eval(`${data.split("\nvar $plugins =\n")[1]}`);
    let playtest = x;

    baseGame = baseGame.filter(a => a.status);
    playtest = playtest.filter(a => a.status);
    playtest = playtest.filter(a => a.name !== "YEP_Debugger");
    playtest = playtest.filter(a => a.name !== "YEP_TestPlayAssist");

    console.log(baseGame, playtest);
    
    let changedFiles = [];
    let newFiles = [];
    let prefChanges = {};
    let done = 0;
    for (let a of playtest) {
        let x = baseGame.find(e => e.name === a.name)
        if (x) {
            let diff = compare(x.parameters, a.parameters);
            if (diff.length > 0) {
                prefChanges[a.name.toLowerCase()] = diff;
            }

            let data = fs.readFileSync(path.join(playtestBase, "js/plugins", a.name + ".js"));
            let buff_p = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);

            let buff_b = await readEncryptedGameFile(gameBase, "js/plugins/" + a.name + ".js");
            let digest_p = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", buff_p))).map(b=>b.toString(16).padStart(2, '0')).join('');
            let digest_b = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", buff_b))).map(b=>b.toString(16).padStart(2, '0')).join('');
            if (digest_p !== digest_b) {
                changedFiles.push(a.name);
            }
        } else {
            newFiles.push(a.name);
            let diff = compare({}, a.parameters);
            if (diff.length > 0) {
                prefChanges[a.name.toLowerCase()] = diff;
            }
        }
        done++;
        setProgressBar(done, playtest.length);
    }


    return {
        changedFiles, newFiles, prefChanges
    };
}