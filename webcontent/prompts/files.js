import { doPrompt } from "./prompt_system.js";

export async function doFilePrompts(modJson, job) {
    let queueNames = ["audio", "data", "fonts", "img", "languages", "maps", "movies"];

    let queues = {};
    for (let name of queueNames) {
        queues[name] = {
            new: job.completelyNew.filter(a => a.startsWith(name)).map(a => a.replace(new RegExp("^" + name + "\\/"), "")),
            existing: job.inGameChanged.filter(a => a.startsWith(name)).map(a => a.replace(new RegExp("^" + name + "\\/"), ""))
        }
    }

    console.log(queues);

    let audio = [...queues.audio.new.map(a => ([0, 1, a, [0, 1]])), ...queues.audio.existing.map(a => ([0, 0, a, [0, 1]]))];
    audio = audio.sort((a, b) => {
        if (a[2]>b[2]) return 1;
        if (a[2]<b[2]) return -1;
        return 0;
    });

    queues.data.new = queues.data.new.sort();
    queues.data.existing = queues.data.existing.sort();

    let data = [
        ...(queues.data.existing.length > 0 ? [[1, "Existing data files"]] : []),
        ...queues.data.existing.map(a => ([0, 0, a, [0, 1, 2]])),
        ...(queues.data.new.length > 0 ? [[1, "New data files"]] : []),
        ...queues.data.new.map(a => ([0, 1, a, [0, 2]])),
    ];

    let fonts = [...queues.fonts.new.map(a => ([0, 1, a, [0, 1]])), ...queues.fonts.existing.map(a => ([0, 0, a, [0, 1]]))];
    fonts = fonts.sort((a, b) => {
        if (a[2]>b[2]) return 1;
        if (a[2]<b[2]) return -1;
        return 0;
    });

    queues.img.new = queues.img.new.sort();
    queues.img.existing = queues.img.existing.sort();

    let img = [
        ...(queues.img.existing.length > 0 ? [[1, "Existing image files"]] : []),
        ...queues.img.existing.map(a => ([0, 0, a, (a.endsWith("png") ? [0, 1, 2] : [0,2])])),
        ...(queues.img.new.length > 0 ? [[1, "New image files"]] : []),
        ...queues.img.new.map(a => ([0, 1, a, [0, 2]])),
    ];

    queues.languages.new = queues.languages.new.sort();
    queues.languages.existing = queues.languages.existing.sort();

    let lang = [
        ...(queues.languages.existing.length > 0 ? [[1, "Existing language files"]] : []),
        ...queues.languages.existing.map(a => ([0, 0, a, [0, 1, 2]])),
        ...(queues.languages.new.length > 0 ? [[1, "New language files"]] : []),
        ...queues.languages.new.map(a => ([0, 1, a, [0, 2]])),
    ];

    queues.maps.new = queues.maps.new.sort();
    queues.maps.existing = queues.maps.existing.sort();

    let maps = [
        ...(queues.maps.existing.length > 0 ? [[1, "Existing map files"]] : []),
        ...queues.maps.existing.map(a => ([0, 0, a, [0, 1, 2]])),
        ...(queues.maps.new.length > 0 ? [[1, "New map files"]] : []),
        ...queues.maps.new.map(a => ([0, 1, a, [0, 2]])),
    ];

    let movies = [...queues.movies.new.map(a => ([0, 1, a, [0, 1]])), ...queues.movies.existing.map(a => ([0, 0, a, [0, 1]]))];
    movies = movies.sort((a, b) => {
        if (a[2]>b[2]) return 1;
        if (a[2]<b[2]) return -1;
        return 0;
    });
    
    let audioDecisions = {};
    let dataDecisions = {};
    let fontDecisions = {};
    let imgDecisions = {};
    let langDecisions = {};
    let mapsDecisions = {};
    let movieDecisions = {}

    if (audio.length > 0)
        audioDecisions = await doPrompt("What to do with audio files?", audio, ["Ignore", "Include"]);

    if (data.length > 0)
        dataDecisions = await doPrompt("What to do with data files?", data, ["Ignore", "Delta", "Include"]);

    if (fonts.length > 0)
        fontDecisions = await doPrompt("What to do with font files?", fonts, ["Ignore", "Include"]);
        
    if (img.length > 0)
        imgDecisions = await doPrompt("What to do with image files?", img, ["Ignore", "Delta", "Include"]);

    if (lang.length > 0)
        langDecisions = await doPrompt("What to do with language files?", lang, ["Ignore", "Delta", "Include"]);

    if (maps.length > 0)
        mapsDecisions = await doPrompt("What to do with map files?", maps, ["Ignore", "Delta", "Include"]);

    if (movies.length > 0)
        movieDecisions = await doPrompt("What to do with movie files?", movies, ["Ignore", "Include"]);

    return { audioDecisions, dataDecisions, fontDecisions, imgDecisions, langDecisions, mapsDecisions, movieDecisions };
}