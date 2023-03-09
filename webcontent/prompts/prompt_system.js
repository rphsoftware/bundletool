export function doPrompt(title, options, optionTitles) {
    return new Promise(resolve => {
        let ol = document.querySelector(".option-list");
        ol.style.display="flex";

        let oli = document.querySelector(".option-list-inner");
        oli.innerHTML = "";

        let olh = document.querySelector(".option-list>h2");
        olh.innerText = title;

        // Creating titles
        let headers = document.createElement("div");
        headers.classList.add("option-headers");

        let checkboxes = {};
        let retval = {};


        for (let title of optionTitles) {
            let oh = document.createElement("div");
            oh.classList.add("o-h");
            oh.innerText = title;
            headers.appendChild(oh);

            checkboxes[optionTitles.indexOf(title)] = [];
            oh.style = "cursor: pointer; user-select: none;";

            oh.addEventListener("click", () => {
                let e = checkboxes[optionTitles.indexOf(title)];
                for(let eleme of e) {
                    eleme.checked = true;
                    retval[eleme.dataset.f] = optionTitles.indexOf(title);
                }
            });
        }

        oli.appendChild(headers);

        let ra = 0;

        for (let [type, ...params] of options) {
            ra++;
            if (type === 0) {
                let o = document.createElement("div");
                o.classList.add("option");

                let [age, text, options] = params;
                retval[text] = 0;
                let ageElement = document.createElement("div");
                ageElement.classList.add(age === 0 ? "option-old" : "option-new");
                o.appendChild(ageElement);

                let textElement = document.createElement("div");
                textElement.classList.add("option-text");
                textElement.innerText = text;
                o.appendChild(textElement);

                let cluster = document.createElement("div");
                cluster.classList.add("option-button-cluster");

                for (let optId = 0; optId < optionTitles.length; optId++) {
                    let holderDiv = document.createElement("div");
                    if (options.indexOf(optId) !== -1) {
                        let el = document.createElement("input");
                        el.type = "radio";
                        if (optId === 0) el.checked = true;
                        el.name = `o_${ra}`;
                        el.dataset.f = text;

                        el.addEventListener("change", () => {
                            if (el.checked) retval[text] = optId;
                        });

                        checkboxes[optId].push(el);

                        holderDiv.appendChild(el);
                    } else {
                        holderDiv.classList.add("noop");
                    }

                    cluster.appendChild(holderDiv);
                }

                o.appendChild(cluster);

                oli.appendChild(o);
            }
            if (type === 1) {
                let o = document.createElement("div");
                o.classList.add("option-header");
                o.innerText = params[0];
                oli.appendChild(o);
            }
        }

        let b = document.createElement("button");
        b.innerText = "Continue";
        b.addEventListener("click", () => {
            b.remove();
            ol.style.display = "none";
            resolve(retval);
        });

        ol.appendChild(b);
    });
}

export function iconPrompt() {
    let d = document.querySelector(".icon-prompt>div");
    d.innerHTML = "";
    
    let p = document.querySelector(".icon-prompt");
    p.style.display = "Flex";

    return new Promise(resolve => {
        let btnYes = document.createElement("button");
        btnYes.innerText = "YES";

        let btnNo = document.createElement("button");
        btnNo.innerText = "NO";

        d.appendChild(btnNo);
        d.appendChild(btnYes);

        btnNo.addEventListener("click", () => {
            p.style.display = "none";
            resolve(false);
        })

        btnYes.addEventListener("click", () => {
            p.style.display = "none";
            resolve(true);
        })
    })
}