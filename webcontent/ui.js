export function setJobTitle(t) {
    document.querySelector(".job-heading").innerText = t;
}
export function setProgrssBar(c, m) {
    document.querySelector(".progress-bar-inner").style.width = `${(c / m) * 100}%`;
}

export function setSubtitle(t) {
    document.querySelector(".job-extra-info").innerText = t;
}
export function setProgressBar(c,m){
    setProgrssBar(c,m);
}