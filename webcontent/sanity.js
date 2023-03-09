export function sanityCheck(p) {
    const fs = window.parent.require('fs');
    const path = window.parent.require('path');

    // Check if the playtest folder makes sense
    let requiredPaths = [
        "index.html",
        "Game.rpgproject",
        "img",
        "img/pictures",
        "audio",
        "audio/bgm",
        "js",
        "languages",
        "js/plugins",
        "js/plugins/OMORI Base.js",
        "package.json"
    ];

    let passed = new Set();
    let failed = new Set();

    for (let e of requiredPaths) {
        if (fs.existsSync(path.join(p, e))) {
            passed.add(e);
        } else {
            failed.add(e);
        }
    }

    if (requiredPaths.length == passed.size && failed.size == 0) {
        return true;
    } else {
        alert("This does not appear to be a valid playtest folder. \nExpected paths that weren't found: " + Array.from(failed).join(","));
        return false;
    }
}