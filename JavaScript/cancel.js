
    // Start JS Cancel

    /** @typedef {boolean} redirect */
    /** @type {redirect} */
    /** @typedef {string} buttonId */
    /** @type {buttonId} */
    /** @typedef {string} url */
    /** @type {url} */

    if (redirect) {
        document.getElementById(buttonId).addEventListener('click', function() {
            setTimeout(function() {
                window.location.href = url;
            }, 400);});
    } else {
        document.getElementById(buttonId).addEventListener('click', function() {
            setTimeout(function() {
                window.location.reload();
            }, 400);

        });
    }

    // End JS Cancel

