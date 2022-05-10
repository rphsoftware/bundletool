let lastYield = Date.now();

export async function maybeYield() {
    if ((Date.now() - 20) > lastYield) {
        await forceYield();
    }
}
export async function forceYield() {
    await new Promise(r => requestAnimationFrame(r));
    lastYield = Date.now();
}