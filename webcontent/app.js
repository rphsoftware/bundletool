import { performSpecialCase } from "./data_special_case.js";
import { runComparison } from "./fileComparer.js";
import { compareIcons } from "./icon.js";
import { commitOldData } from "./olddata.js";
import { performBundle } from "./performBundling.js";
import { comparePlugins } from "./plugins.js";
import { doFilePrompts } from "./prompts/files.js";
import { processPluginOptions } from "./prompts/plugins.js";
import { doPrompt, iconPrompt } from "./prompts/prompt_system.js";
import { sanityCheck } from './sanity.js';
import { setJobTitle } from "./ui.js";
import { forceYield } from "./yielder.js";

const fs = window.parent.require('fs');
const path = window.parent.require('path');
const base = path.dirname(window.parent.process.mainModule.filename);

async function s2(p) {
    let form = document.querySelector("#mainform");
    if( !form.reportValidity() ) return;

    
    let d = commitOldData();

    let cmpPaths = [];
    if (d.i_audio) cmpPaths.push("audio");    
    if (d.i_data) cmpPaths.push("data");
    if (d.i_fonts) cmpPaths.push("fonts");
    if (d.i_img) cmpPaths.push("img");
    if (d.i_lang) cmpPaths.push("languages");
    if (d.i_maps) cmpPaths.push("maps");
    if (d.i_movies) cmpPaths.push("movies");

    if (cmpPaths.length === 0 && !d.i_plugins && !d.i_icon)
        return alert("You didn't give me any work to do. Tick some boxes!");


    document.querySelector(".mod-details").remove();
    document.querySelector(".job-status").style.display = "flex";

    let jobs = {
        plugins: {
            prefChanges: {},
            changedFiles: [],
            newFiles: [],
        },
        icon: false,
        files: {
            inGameChanged: [],
            completelyNew: []
        }
    };
   
    if (cmpPaths.length > 0) 
        jobs.files = await runComparison(cmpPaths, base, p);

    if (d.i_icon)
        jobs.icon = await compareIcons(base, p);

    if (d.i_plugins)
        jobs.plugins = await comparePlugins(base, p);
    
    jobs.files = await performSpecialCase(jobs.files, p, base);
    let modJson = {
        id: d.modid,
        name: d.modname,
        description: d.moddescription,
        version: d.modversion,
        manifestVersion: 1,
        _flags: [
            "do_olid"
        ],
        image_deltas: [],
        files: {
            plugins: [],
            assets: [],
            files: [],
            maps: [],
            text: [],
            data: []
        },
        "$schema": "https://rph.space/oneloader.manifestv1.schema.json",
    }

    let jobDecisions = {
        icon: false
    };

    jobDecisions.files = await doFilePrompts(modJson, jobs.files);

    if (jobs.icon) {
        jobDecisions.icon = await iconPrompt();
    }

    jobDecisions.plugins = await processPluginOptions(modJson, jobs.plugins);

    await performBundle(modJson, jobDecisions, base, p);
}

function s1(p) {
    if (!sanityCheck(p)) {
        return;
    }

    document.querySelector(".welcome-screen").remove();
    document.querySelector(".mod-details").style.display = "flex";

    document.querySelector("#begin-process").addEventListener("click", () => {
        s2(p);
    })
}


document.querySelector("#continue-button").addEventListener("click", () => {
    let u = document.querySelector("#folder-picker");
    if (u.files.length < 1) return alert("Select a folder");

    let path = u.files[0].path;
    s1(path);
});

