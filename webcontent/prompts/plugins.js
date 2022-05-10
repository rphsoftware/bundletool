import { doPrompt } from "./prompt_system.js";

export async function processPluginOptions(modJson, job) {
    let pluginDecisions, pluginPrefDecisions;
    if (job.changedFiles.length > 0 || job.newFiles.length > 0) {
        pluginDecisions = await doPrompt("What to do with plugin files?",[
            ...(job.changedFiles.length > 0 ? [[1, "Edited game plugins"]] : []),
            ...job.changedFiles.map(value => ([0, 0, value, [0,2]])),
            ...(job.newFiles.length > 0 ? [[1, "New plugins"]] : []),
            ...job.newFiles.map(value => ([0,1,value,[0,1,2]]))
        ], ["Ignore", "Unique name", "Include"]);    
    }

    if (Object.keys(job.prefChanges).length > 0) {
        pluginPrefDecisions = await doPrompt("What to do with plugin parameters?", [
            ...Object.keys(job.prefChanges).map(value => [0,0,value,[0,1]])
        ],["Ignore","Include"]);
        modJson.plugin_parameters = {};

        for (let a in pluginPrefDecisions) {
            if (pluginPrefDecisions[a] === 1) {
                modJson.plugin_parameters[a] = job.prefChanges[a];
            }
        }
    }


    return { pluginDecisions };
}