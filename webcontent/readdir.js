import { setSubtitle } from "./ui.js";
import { maybeYield } from "./yielder.js";

const fs = window.parent.require('fs');
const path = window.parent.require('path').posix;

export let lastSpecialMode = 1;

export function setLastSpecialMode(a) {
    lastSpecialMode = a;
}

async function doRead(g, base, specialMode) {
    let files = fs.readdirSync(g);
    let retvals = [];

    for (let a of files) {
        let stats = fs.statSync(path.join(g, a));
        await maybeYield();
        if (specialMode > -1) {
            setSubtitle("Reading folder: " + lastSpecialMode);
            lastSpecialMode++;
        }
        if (stats.isFile()) {
            retvals.push(path.join(base, a));
        } else {
            let f = await doRead(path.join(g, a), path.join(base, a), specialMode);
            for (let b of f) {
                retvals.push(b);
            }
        }
    }

    return retvals;
}

export async function recursiveReaddir(p, s) {
    if (!s) {
        return await doRead(p, "/", -1);
    } else {
        return await doRead(p, "/", 1);
    }
}