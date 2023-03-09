// This file, unlike it's peer
// is not special.
// It did not achieve anything
// in life and is generally thought
// to be the inferior child.


import { setJobTitle, setSubtitle, setProgressBar } from "./ui.js";
import { forceYield } from "./yielder.js";

const fs = window.parent.require('fs');
const path = window.parent.require('path');
export async function compareIcons(gameBase, playtestBase) {
    setJobTitle("Comparing icon");
    setSubtitle("Reading base-game icon");
    setProgressBar(0, 1);
    await forceYield();

    let data;
    if (fs.existsSync(path.join(gameBase, "icon", "icon-oneloader-backup.png"))) {
        data = fs.readFileSync(path.join(gameBase, "icon", "icon-oneloader-backup.png"));
    } else {
        data = fs.readFileSync(path.join(gameBase, "icon", "icon.png"));
    }
    let baseGameBuff = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);

    setSubtitle("Reading playtest icon");
    await forceYield();

    let data2 = fs.readFileSync(path.join(playtestBase, "icon", "icon.png"));
    let playtestBuff = data2.buffer.slice(data2.byteOffset, data2.byteOffset + data2.byteLength);

    setSubtitle("Comparing");
    await forceYield();

    let digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", baseGameBuff))).map(b=>b.toString(16).padStart(2, '0')).join('');
    let digest2 = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", playtestBuff))).map(b=>b.toString(16).padStart(2, '0')).join('');

    return digest !== digest2;
}