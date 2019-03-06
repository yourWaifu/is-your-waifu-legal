/*
redirect the user to the index.html with values in the url as a query value
not really sure if this is a good tho
*/
function f() {
    let currentURL = window.location.pathname;
    //sanitize input for the final url
    currentURL = currentURL.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    //get last /
    let subURL = currentURL.substr(currentURL.lastIndexOf("/") + 1);
    let finalURL = "https://yourwaifu.dev/is-your-waifu-legal?q=" + subURL;
    window.location.replace(finalURL);
}
f();
window.onload = () => f();
