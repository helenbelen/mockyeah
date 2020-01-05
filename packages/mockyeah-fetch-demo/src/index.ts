import Mockyeah from "@mockyeah/fetch";

const mockyeah = new Mockyeah({
    noWebSocket: true
});

// @ts-ignore
window.__MOCKYEAH__ = mockyeah;

fetch('https://httpbin.org/status/200');

const refetch = async () => {
    const resJson = await fetch('https://httpbin.org/json')
    const json = await resJson.json();

    console.log('JSON', json)

    // const resHtml = await fetch('https://httpbin.org/html')
    // const html = await resHtml.text()
    //
    // console.log('HTML', html)
};

// @ts-ignore
window.refetch = refetch;

refetch();
