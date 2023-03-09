import { readEncryptedGameFile } from "./transformers.js";
import { setJobTitle, setProgressBar, setSubtitle } from "./ui.js";
import { forceYield, maybeYield } from "./yielder.js";
import { load } from './js-yaml.mjs';
import { normalizeMapInfosTree, normalizeSystemjsonTree } from "./data_special_case.js";
import {default as loadwasm, create_diff, apply_diff, tile_size} from './pkg/imagediff2.js';
import { compare } from "./e/index.mjs";
import * as pako from './pako.esm.mjs';
import jszip from './jszip-esm5.js';
console.log(jszip);
const fs = window.parent.require('fs');
const path = window.parent.require('path');
const ppath = window.parent.require('path').posix;

function _overlay_fs_split_path(path) {
    let pathComponentRe = /[\/\\]*([^\\\/]+)[\/\\]*/g;
    let pathComponents = [];

    while(1) {
        let val = pathComponentRe.exec(path);
        if (val) {
            pathComponents.push(val[1]);
        } else {
            break;
        }
    }

    return pathComponents;
}
let e;
function ensureFolder(p, base) {
    let e = _overlay_fs_split_path(p);
    e.pop();

    let gp = "";
    for (let a of e) {
        gp = ppath.join(gp, a);
        try { fs.mkdirSync(path.join( base, gp )); } catch(e) {};
    }
}

function imgToCanvas(img) {
    let width = Math.ceil(img.width / e) * e;
    let height = Math.ceil(img.height / e) * e;

    let canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    let ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    return ctx;
}

export async function performBundle(modJson, jobDecisions, gameBase, playtestBase) {
    const tmpBase = path.join(gameBase, "..", ".bundletool_temporary");
    setJobTitle("Building the mod...");
    setSubtitle("");
    setProgressBar(0, 1);

    setSubtitle("Preparing the folder structure");

    await forceYield();

    for (let i = 0; i < 10; i++) { // SMB bug, idk man
        console.log(fs.existsSync(tmpBase));
        try { fs.mkdirSync(tmpBase) ; } catch(e) { };
        await forceYield();
    }

    try { fs.mkdirSync(path.join(tmpBase, "plugins")); } catch(e) { console.error(e); }

    if (jobDecisions.icon) {
        setSubtitle("Applying icon...");
        let data = fs.readFileSync(path.join(playtestBase, "icon", "icon.png"));

        fs.writeFileSync(path.join(tmpBase, "_bundletool_mod_icon.png"), data);

        modJson.game_icon = "_bundletool_mod_icon.png";
    }

    setSubtitle("Applying plugins");

    await forceYield();
    
    let done = 0;
    for (let pluginPath in jobDecisions.plugins.pluginDecisions) {
        let decision = jobDecisions.plugins.pluginDecisions[pluginPath];

        if (decision>0) {
            let data = fs.readFileSync(path.join(playtestBase, "js/plugins", pluginPath + ".js"));
            let targetPath;
            if (decision === 1) {
                targetPath = ppath.join("plugins", `_bt_uniq_${modJson.id}_${pluginPath}.js`);
            } else {
                targetPath = ppath.join("plugins", `${pluginPath}.js`);
            }
            modJson.files.plugins.push(targetPath);

            fs.writeFileSync(path.join(tmpBase, targetPath), data);
        }

        done++;

        setProgressBar(done, Object.keys(jobDecisions.plugins.pluginDecisions).length);
        await maybeYield();
    }

    setSubtitle("Applying audio");
    await forceYield();
    done = 0;

    try { fs.mkdirSync(path.join(tmpBase, "audio")); } catch(e) { console.error(e); }

    for (let audioPath in jobDecisions.files.audioDecisions) {
        if (jobDecisions.files.audioDecisions[audioPath] === 1) {
            ensureFolder(ppath.join("audio", audioPath), tmpBase);

            let data = fs.readFileSync(path.join(playtestBase, "audio", audioPath));
            fs.writeFileSync(path.join(tmpBase, "audio", audioPath), data);

            setSubtitle("Audio: " + audioPath);

            modJson.files.assets.push(ppath.join("audio", audioPath));
        }

        done++;
        setProgressBar(done, Object.keys(jobDecisions.files.audioDecisions).length);
        await maybeYield();
    }

    setSubtitle("Applying fonts");
    await forceYield();
    done = 0;

    try { fs.mkdirSync(path.join(tmpBase, "fonts")); } catch(e) { console.error(e); }

    for (let fontPath in jobDecisions.files.fontDecisions) {
        if (jobDecisions.files.fontDecisions[fontPath] === 1) {
            ensureFolder(ppath.join("fonts", fontPath), tmpBase);

            let data = fs.readFileSync(path.join(playtestBase, "fonts", fontPath));
            fs.writeFileSync(path.join(tmpBase, "fonts", fontPath), data);

            setSubtitle("Font: " + fontPath);

            modJson.files.assets.push(ppath.join("fonts", fontPath));
        }

        done++;
        setProgressBar(done, Object.keys(jobDecisions.files.fontDecisions).length);
        await maybeYield();
    }

    setSubtitle("Applying movies");
    await forceYield();
    done = 0;

    try { fs.mkdirSync(path.join(tmpBase, "movies")); } catch(e) { console.error(e); }

    for (let moviePath in jobDecisions.files.movieDecisions) {
        if (jobDecisions.files.movieDecisions[moviePath] === 1) {
            ensureFolder(ppath.join("movies", moviePath), tmpBase);

            let data = fs.readFileSync(path.join(playtestBase, "movies", moviePath));
            fs.writeFileSync(path.join(tmpBase, "movies", moviePath), data);

            setSubtitle("Movie: " + moviePath);

            modJson.files.assets.push(ppath.join("movies", moviePath));
        }

        done++;
        setProgressBar(done, Object.keys(jobDecisions.files.movieDecisions).length);
        await maybeYield();
    }

    setSubtitle("Applying data");
    await forceYield();
    done = 0;

    try { fs.mkdirSync(path.join(tmpBase, "data")); } catch(e) {  }
    
    for (let dataPath in jobDecisions.files.dataDecisions) {
        let decision = jobDecisions.files.dataDecisions[dataPath];

        if (decision > 0) {
            let mode = (dataPath.endsWith("yml") || dataPath.endsWith("yaml")) ? "yaml":"json";
            if (decision === 1) { // Delta
                let bgdata = readEncryptedGameFile(gameBase, path.join("data", dataPath), "utf-8");
                let ptdata = fs.readFileSync(path.join(playtestBase, "data", dataPath), "utf-8");

                let ext = "jsond";
                if (mode == "json") {
                    bgdata = JSON.parse(bgdata);
                    ptdata = JSON.parse(ptdata);
                } else {
                    bgdata = load(bgdata);
                    ptdata = load(ptdata);
                    ext = "yamld";
                }

                if (dataPath === "System.json") {
                    bgdata = normalizeSystemjsonTree(bgdata);
                    ptdata = normalizeSystemjsonTree(ptdata);
                }
                if (dataPath === "MapInfos.json") {
                    bgdata = normalizeMapInfosTree(bgdata);
                    ptdata = normalizeMapInfosTree(ptdata);
                }

                let delta = compare(bgdata, ptdata);
                let noExtFname = dataPath.split(/\.[^\.]+$/)[0];
                fs.writeFileSync(path.join(tmpBase, "data", `${noExtFname}.${ext}`), JSON.stringify(delta));

                modJson.files.data.push(ppath.join("data", `${noExtFname}.${ext}`));
            } else {
                let data = fs.readFileSync(path.join(playtestBase, "data", dataPath));
                fs.writeFileSync(path.join(tmpBase, "data", dataPath), data);

                modJson.files.data.push(ppath.join("data", dataPath));
            }
        }

        done++;
        setProgressBar(done, Object.keys(jobDecisions.files.dataDecisions).length);
        setSubtitle("Applying data: " + dataPath);
        await maybeYield();
    }

    setSubtitle("Applying maps");
    await forceYield();
    done = 0;

    try { fs.mkdirSync(path.join(tmpBase, "maps")); } catch(e) { }

    for (let mapPath in jobDecisions.files.mapsDecisions) {
        let decision = jobDecisions.files.mapsDecisions[mapPath];

        if (decision > 0) {
            if (decision === 1) {
                let bgdata = readEncryptedGameFile(gameBase, path.join("maps", mapPath), "utf-8");
                let ptdata = fs.readFileSync(path.join(playtestBase, "maps", mapPath), "utf-8");

                let ext = "jsond";
                bgdata = JSON.parse(bgdata);
                ptdata = JSON.parse(ptdata);

                let delta = compare(bgdata, ptdata);
                let noExtFname = mapPath.split(/\.[^\.]+$/)[0];
                fs.writeFileSync(path.join(tmpBase, "maps", `${noExtFname}.${ext}`), JSON.stringify(delta));

                modJson.files.maps.push(ppath.join("maps", `${noExtFname}.${ext}`));
            } else {
                let data = fs.readFileSync(path.join(playtestBase, "maps", mapPath));
                fs.writeFileSync(path.join(tmpBase, "maps", mapPath), data);

                modJson.files.maps.push(ppath.join("maps", mapPath));
            }
        }

        done++;
        setProgressBar(done, Object.keys(jobDecisions.files.mapsDecisions).length);
        setSubtitle("Applying maps: " + mapPath);
        await maybeYield();
    }

    setSubtitle("Applying languages");
    await forceYield();
    done = 0;

    try { fs.mkdirSync(path.join(tmpBase, "languages")); } catch(e) {}

    for (let langPath in jobDecisions.files.langDecisions) {
        let decision = jobDecisions.files.langDecisions[langPath];

        if (decision > 0) {
            if (decision === 1) {
                let bgdata = readEncryptedGameFile(gameBase, path.join("languages", langPath), "utf-8");
                let ptdata = fs.readFileSync(path.join(playtestBase, "languages", langPath), "utf-8");

                let ext = "yamld";
                bgdata = load(bgdata);
                ptdata = load(ptdata);

                let delta = compare(bgdata, ptdata);
                langPath = langPath.split("/")[1];
                let noExtFname = langPath.split(/\.[^\.]+$/)[0];
                fs.writeFileSync(path.join(tmpBase, "languages", `${noExtFname}.${ext}`), JSON.stringify(delta));

                modJson.files.text.push(ppath.join("languages", `${noExtFname}.${ext}`));
            } else {
                let data = fs.readFileSync(path.join(playtestBase, "languages", langPath));
                langPath = langPath.split("/")[1];
                fs.writeFileSync(path.join(tmpBase, "languages", langPath), data);

                modJson.files.text.push(ppath.join("languages", langPath));
            }
        }

        done++;
        setProgressBar(done, Object.keys(jobDecisions.files.langDecisions).length);
        setSubtitle("Applying text: " + langPath);
        await maybeYield();
    }

    setSubtitle("Applying images");
    await forceYield();

    await loadwasm();
    e = tile_size();
    try { fs.mkdirSync(path.join(tmpBase, "img")); } catch(e) { }
    try { fs.mkdirSync(path.join(tmpBase, "olid")); } catch(e) { }


    for (let imgPath in jobDecisions.files.imgDecisions) {
        let decision = jobDecisions.files.imgDecisions[imgPath];

        if (decision > 0) {
            ensureFolder(ppath.join("img", imgPath), tmpBase);

            if (decision === 1) {
                // fixme: do this shit
                let bgdata = readEncryptedGameFile(gameBase, path.join("img", imgPath));
                let ptdata = fs.readFileSync(path.join(playtestBase,   "img", imgPath));
                ptdata = ptdata.buffer.slice(ptdata.byteOffset, ptdata.byteOffset + ptdata.byteLength);

                let bg = new Blob([bgdata], { "type": "image"});
                let pt = new Blob([ptdata], { "type": "image"});
                let sourceURL = URL.createObjectURL(bg);
                let targetURL = URL.createObjectURL(pt);

                const [
                    sourceImg,
                    targetImg
                ] = await Promise.all([
                    new Promise(resolve => {const img = new Image();img.onload = () => resolve(img);img.src = sourceURL;}),
                    new Promise(resolve => {const img = new Image();img.onload = () => resolve(img);img.src = targetURL;})
                ]);

                const source = imgToCanvas(sourceImg);
                const target = imgToCanvas(targetImg);
    
                URL.revokeObjectURL(sourceURL);
                URL.revokeObjectURL(targetURL);

                let segments = [];
                console.log("Diffing");
                console.time("Diff");
                for (let x = 0; x < Math.ceil(targetImg.width / e); x++) {
                    for (let y = 0; y < Math.ceil(targetImg.height / e); y++) {
                        let sourceBitmap;
                        if (sourceImg.width < (x * e) || sourceImg.height < (y * e)) {
                            sourceBitmap = new ArrayBuffer(e*e*4);
                        } else {
                            sourceBitmap = source.getImageData(x * e, y * e, e, e).data.buffer;
                        }
    
                        let targetBitmap = target.getImageData(x * e, y * e, e, e).data.buffer;
    
                        let diff = create_diff(new Uint32Array(sourceBitmap), new Uint32Array(targetBitmap));
                        if (diff.byteLength > Math.floor((e * e) / 8)) {
                            let targetData = new ArrayBuffer(8 + diff.byteLength); // 2 - x, 2 - y, 4 - len
                            let view = new DataView(targetData);
                            view.setUint16(0, x);
                            view.setUint16(2, y);
                            view.setUint32(4, diff.byteLength);
                            let targetArr = new Uint8Array(targetData);
                            targetArr.set(diff, 8);
    
                            segments.push(targetArr);
                        }
                    }
                }
                console.timeEnd("Diff");
                console.time("compress");
                let totalLen = segments.reduce((a, b)=>a+b.byteLength, 0);
                let uncompressed = new Uint8Array(new ArrayBuffer(totalLen));
                let ptr = 0;
                for (let block of segments) {
                    uncompressed.set(block, ptr);
                    ptr += block.byteLength;
                }
                let compressed = pako.deflate(uncompressed);
                console.timeEnd("compress");
                
                let randomBytes = new ArrayBuffer(8);
                let randomBytesDV = new DataView(randomBytes);
                for (let i = 0; i < 8; i++) {
                    randomBytesDV.setUint8(i, Math.floor(Math.random() * 256));
                }
    
                let output = new ArrayBuffer(6 + 4 + 4 + 8 + 4 + compressed.byteLength);
                let outputDv = new DataView(output);
                let outputBuf = new Uint8Array(output);
                outputDv.setUint32(0, 0xFEFFD808);
                outputDv.setUint16(4, 0xDD21);
                outputDv.setUint32(6, targetImg.width);
                outputDv.setUint32(10, targetImg.height);
                outputBuf.set(new Uint8Array(randomBytes), 14);
                outputDv.setUint32(22, compressed.byteLength);
                outputBuf.set(compressed, 26);
    
                let ee = new Uint8Array(32);
                window.crypto.getRandomValues(ee);
                let name = Array.from(ee).map(b=>b.toString(16).padStart(2, '0')).join('');

                fs.writeFileSync(path.join(tmpBase, "olid", name + ".olid"), new Uint8Array(output));

                let entry = {patch: ppath.join("img", imgPath), with: ppath.join("olid", name + ".olid"), dir: false};
                modJson.image_deltas.push(entry);
            } else {
                let data = fs.readFileSync(path.join(playtestBase, "img", imgPath));
                fs.writeFileSync(path.join(tmpBase, "img", imgPath), data);

    
                modJson.files.assets.push(ppath.join("img", imgPath));
            }
        }

        done++;
        setProgressBar(done, Object.keys(jobDecisions.files.imgDecisions).length);
        setSubtitle("Image: " + imgPath);
        await maybeYield();
    }

    setSubtitle("Saving mod.json");

    fs.writeFileSync(path.join(tmpBase, "mod.json"), JSON.stringify(modJson, null, 2));

    await maybeYield();
    setSubtitle("Where to save?");

    let s = document.getElementById("sa");
    s.setAttribute("nwsaveas", `${modJson.id}.zip`);

    let element = document.querySelector(".file-loc-prompt");
    element.style.display = "flex";
    
    let fpath = await new Promise(resolve => {
        s.click();
        s.onchange = function() {
            console.log(s);
            if (s.files.length > 0) {
                resolve(s.files[0].path);
            }
        }
        s.oncancel = function() {
            console.log("kanzel");
        }
    });

    element.remove();

    await forceYield();
    setJobTitle("Zipping your mod up");
    setSubtitle("This may take a while...");
    setProgressBar(0, 1);
    let zip = new jszip();
    
    async function ae(fsBase, zipWriteBase) {
        let a = fs.readdirSync(fsBase);
        for (let file of a) {
            let pathTotal = path.join(fsBase, file);
            let stats = fs.statSync(pathTotal);
            await maybeYield();
            if (stats.isFile()) {
                let data = fs.readFileSync(pathTotal);
                data = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
                zipWriteBase.file(file, data, {
                    compression: "store"
                });
                setSubtitle(file);
            } else {
                await ae(pathTotal, zipWriteBase.folder(file));
            }
        }
    }

    await ae(tmpBase, zip.folder(modJson.id));

    console.log("Zip complete");
    setSubtitle("Compressing...");
    setJobTitle("Compressing...");
    let ab = await zip.generateAsync({type: "arraybuffer", compression: "DEFLATE"}, ({percent, currentFile}) => {
        setProgressBar(percent, 100);
        setSubtitle(currentFile);
    });
    console.log("Compression done");
    fs.writeFileSync(fpath, new Uint8Array(ab));

    setJobTitle("It's done!");
    setProgressBar(1, 1);
    setSubtitle("You can close your game now!");
}
