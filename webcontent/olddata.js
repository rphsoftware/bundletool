const fs = window.parent.require('fs');
const path = window.parent.require('path');
const base = path.dirname(window.parent.process.mainModule.filename);
if (fs.existsSync(path.join(base, "save", "bundletool_recents.json"))) {
    document.querySelector(".old-data").style.display = "flex";
}

document.querySelector("#discard-old-data").addEventListener("click", () => {
    document.querySelector(".old-data").remove();
    fs.unlinkSync(path.join(base, "save", "bundletool_recents.json"));
});

document.querySelector("#reuse-old-data").addEventListener("click", () => {
    document.querySelector(".old-data").remove();
    let o = JSON.parse(fs.readFileSync(path.join(base, "save", "bundletool_recents.json"), "utf-8"));

    let form = document.querySelector("#mainform");

    for (let el of form.elements) {
        if (el.name.startsWith("i_")) {
            el.checked = o[el.name];
        } else {
            el.value = o[el.name];
        }
    }

});


export function commitOldData() {
    let form = document.querySelector("#mainform");

    let o = {};
    for (let el of form.elements) {
        o[el.name] = el.value;
        if (el.name.startsWith("i_")) {
            o[el.name] = el.checked;
        }
    }

    fs.writeFileSync(path.join(base, "save", "bundletool_recents.json"), JSON.stringify(o, null, 8));
    
    return o;
}