const fs = window.parent.require('fs');
const path = window.parent.require('path');
const base = path.dirname(process.mainModule.filename);

let a; // This is essentially the bailout promise 

let element = document.createElement("div");
let header = document.createElement("h1");
header.innerText = "BundleTool";
let subtext = document.createElement("p");
subtext.innerText = "You are running BundleTool. Please be aware that this mod is not meant for everyday use and should be disabled when not in use. Playing the game with it active is not supported.";

let useBundler = document.createElement("button");
useBundler.innerText = "Use BundleTool";

let continueToGame = document.createElement("button");
continueToGame.innerText = "Continue to game (NOT SUPPORTED)";

element.append(header, subtext, useBundler, continueToGame);
element.style = "width: 100vw; height: 100vh; color: white; font-family: sans-serif; backdrop-filter: blur(30px); position: fixed; top:0; left:0; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 999; background: #000e;";
document.body.appendChild(element);



let mutex = 0;
continueToGame.addEventListener("click", () => {
    if (mutex !== 0) return;
    element.remove();
    a();
});

function bundletoolVfs(mod) {
    async function buildResponseBody(data) {
        $modLoader.$vfsTrace("WEB REQUEST " + JSON.stringify(data));
        let url = new URL(data.request.url);

        if (url.origin === window.location.origin && url.pathname.startsWith("/webcontent/")) {
            let requestPath = url.pathname;
            let ext = requestPath.match(/\.([^\.]*)$/)[1];
            try {
                let rdata = null;
                let type;
                try {
                    rdata = await mod.readFile(requestPath);
                    type = Mime.getType(ext);
                } catch(e) {
                    console.error(e);
                    try {
                        rdata = await mod.readFile("bundletool" + requestPath);
                        type = Mime.getType(ext);
                    } catch(e) {
                        throw e;
                    }
                }
                let hS = "";
                for (let header in data.responseHeaders) {
                    hS = `${hS}${header}: ${data.responseHeaders[header]}\n`;
                }

                if (!hS.toLowerCase().includes("content-type")) {
                    hS = `${hS}content-type: ${type}\n`;
                }

                let responseBody = `HTTP/1.1 200 OK\n${hS}\n`;
                responseBody = Buffer.concat([Buffer.from(responseBody), rdata]).toString("base64");
                return {
                    interceptionId: data.interceptionId,
                    rawResponse: responseBody
                };
            } catch(e) {
                console.error(e);
                window._logLine("Error occured when building response body: " + e.stack);
                return {
                    interceptionId: data.interceptionId
                }
            }
        } else {
            return {
                interceptionId: data.interceptionId
            }
        }
    }
    return new Promise(resolve => {
        window._logLine("Gathering chrome devtools remote debugging candidates");
        chrome.debugger.getTargets((t) => {
            let debugee = {targetId: ""};
            for (let candidate of t) {
                if (candidate.url.endsWith("index.html")) {
                    debugee.targetId = candidate.id;
                }
            }

            chrome.debugger.detach(debugee, () => {
                if(chrome.runtime.lastError) {
                    console.warn(chrome.runtime.lastError.message);
                }

                chrome.debugger.attach(debugee, "1.2", () => {
                    window._logLine("[DEVTOOLS] Successfully attached!");
                    chrome.debugger.onEvent.addListener(async (debugee, event, data) => {
                        if (event === "Network.requestIntercepted") {
                            chrome.debugger.sendCommand(debugee, "Network.continueInterceptedRequest", await buildResponseBody(data));
                        }
                    });
                    chrome.debugger.sendCommand( 
                        debugee, 
                        "Network.setRequestInterception", 
                        {
                            enabled: true, 
                            patterns: [ 
                                {
                                    urlPattern: window.location.origin + "/webcontent/*",
                                    interceptionStage: "HeadersReceived"
                                }
                            ]
                        }
                    );

                    setTimeout(resolve, 100);
                });

                window.__unload_web_vfs = function() {
                    chrome.debugger.detach(debugee);
                };
                window.addEventListener("beforeunload", function(e) {
                    chrome.debugger.detach(debugee);
                });
            });
        })
    });
}

useBundler.addEventListener("click", async () => {
    if (mutex !== 0) return;
    mutex = 1;

    header.innerText = "Please wait, performing setup tasks";

    console.log("Finding myself");
    let mod = params.knownMods.get("bundletool")._raw;

    let a = 0;
    if (fs.existsSync(path.join(base, "..", ".bundletool_temporary"))) {
        header.innerText = "Cleaning up...";
        await new Promise(r=>requestAnimationFrame(r));
        console.log("Cleaning up");

        async function rmR(p) {
            let stats = fs.statSync(p);
            if (stats.isFile()) {
                fs.unlinkSync(p);
            } else {
                let data = fs.readdirSync(p);
                for (let sb of data) {
                    await rmR(path.join(p, sb));
                }
                fs.rmdirSync(p);
                a++;
                header.innerText = "Cleaning up... (" + a + ")";
                await new Promise(r=>requestAnimationFrame(r));
            }
        }

        await rmR(path.join(base, "..", ".bundletool_temporary"));
    }

    let nsz;
    /*async function requestListener(req, res) {
        let requestPath = req.url;
        let ext = requestPath.match(/\.([^\.]*)$/)[1];

        if (requestPath )

        try {
            let file = await mod.readFile(requestPath);
            let type = Mime.getType(ext);
            
            res.setHeader("Content-Type", type);
            res.writeHead(200);
            res.end(file);
        } catch(e) {
            try {
                let file = await mod.readFile("bundletool" + requestPath);
                let type = Mime.getType(ext);
            
                res.setHeader("Content-Type", type);
                res.writeHead(200);
                res.end(file);
            } catch(e) {
                console.log(e);
                res.writeHead(404);
                res.end('');
            }
        }
    }

    const [server, port] = await new Promise((listening, _) => {
        const http = require('http');

        let server = http.createServer(requestListener);
        
        server.listen(0, "127.0.0.1", undefined, () => void listening([server, server.address().port]));
    });*/

    let iframe = document.createElement("iframe");
    await bundletoolVfs(mod);
    //iframe.src = "http://127.0.0.1:" + port + "/webcontent/app.html";
    iframe.src = "/webcontent/app.html";
    iframe.style = "width: 100vw; border: none; height: 100vh; color: white; font-family: sans-serif; backdrop-filter: blur(30px); position: fixed; top:0; left:0; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 999; background: #fff;";
    element.remove();
    document.body.appendChild(iframe);
});

await new Promise(r => {a = r}) // You promise me things
                              // but your promises never resolve
