const EXTENSION_RULES = {
    "png":{"encrypt":"rpgmaker", "target_extension":"rpgmvp"},
    "ogg":{"encrypt":"rpgmaker", "target_extension":"rpgmvo"}
};

const DATA_RULES = [
    {
        formatMap: {
            "json":{target: "KEL", delta: false, encrypt: true},
            "yml":{target:"PLUTO",delta:false, encrypt: true},
            "yaml":{target:"PLUTO", delta:false, encrypt: true}
        },
        mountPoint: "data"
    },
    {
        formatMap: {
            "yml":{target:"HERO",delta:false, encrypt: true},
            "yaml":{target:"HERO", delta:false, encrypt: true}
        },
        mountPoint: "languages/en"
    },
    {
        formatMap: {
            "json":{target: "AUBREY", delta: false, encrypt: true}
        },
        mountPoint: "maps"
    },
    {
        formatMap: {
            "js": {target:"OMORI"}
        },
        mountPoint: "js/plugins"
    }
];


export function transformFilenameForEncrypted(d) {
    let name = d;
    // Apply extension rules
    for (let key in EXTENSION_RULES) {
        name = name.replace(new RegExp(key + "$"), EXTENSION_RULES[key].target_extension);
    }

    for (let rule of DATA_RULES) {
        if ((new RegExp("^" + rule.mountPoint)).test(d)) {
            for (let key in rule.formatMap) {
                name = name.replace(new RegExp(key + "$"), rule.formatMap[key].target);
            }
        }
    }

    return name;
}

const fs = window.parent.require('fs');
const path = window.parent.require('path');

export function readEncryptedGameFile(gameBase, d, encoding) {
    d = d.replace(/\\/g, "/");
    let transformed = transformFilenameForEncrypted(d);
    let data = fs.readFileSync(path.join(gameBase, transformed));

    if (/(kel|aubrey|hero|pluto|omori)$/i.test(transformed)) {
        data = window.parent._modloader_encryption.decrypt(data);
    }

    if (/(rpgmvo|rpgmvp)$/i.test(transformed)) {
        data = window.parent._modloader_encryption.decryptAsset(data);
    }

    let buff = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);

    if (encoding) {
        return data.toString(encoding);
    }

    return buff;
}