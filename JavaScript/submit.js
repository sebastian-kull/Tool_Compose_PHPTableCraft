// Start JS Submit

/** @typedef {string} saveBtnId */
/** @type {saveBtnId} */
/** @typedef {string} instanceId */
/** @type {instanceId} */
/** @typedef {string} submitRedirectUrl */
/** @type {submitRedirectUrl} */
/** @typedef {string} postUrl */
/** @type {postUrl} */
/** @typedef {boolean} submitRedirect */
/** @type {submitRedirect} */
/** @typedef {boolean} postIsAjax */
/** @type {postIsAjax} */

;

    function deepDiff(newData, originalData, bla = "") {

        const result = {};

        for (const key in newData) {
            if (!(key in originalData)) {
                result[key] = {added: newData[key]};
                continue;
            }

            const newValue = newData[key];
            const originalValue = originalData[key];


            if (typeof newValue === 'object' && newValue !== null && typeof originalValue === 'object' && originalValue !== null) {
                const changes = deepDiff(newValue, originalValue);
                if (Object.keys(changes).length > 0) {
                    result[key] = changes;
                }
            } else {
                if (newValue.startsWith('[')) {
                    const parsedNewValue = JSON.parse(newValue)
                    const parsedOriginalValue = JSON.parse(originalValue)

                    if (!arraysAreIdentical(parsedNewValue, parsedOriginalValue)) {
                        result[key] = newValue;
                    }
                }
                else {
                    if (newValue !== originalValue) {
                        result[key] = newValue;

                    }
                }
            }
        }

        for (const key in originalData) {
            if (!(key in newData)) {
                result[key] = {deleted: originalData[key]};
            }
        }

        return result;
    }

    function arraysAreIdentical(arr1, arr2) {
        if (arr1.length !== arr2.length) {
            return false;
        }

        arr1.sort();
        arr2.sort();

        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) {
                return false;
            }
        }

        return true;
    }

function getValues() {
    const instance = document.getElementById(instanceId);
    const tables = instance.querySelectorAll('table');

    const data = {};

    tables.forEach(table => {
        const rows = table.querySelectorAll('tbody tr');
        const tableData = {};

        rows.forEach(row => {
            const rowData = {};
            const id = row.getAttribute("data-row_id");

            for (const attr of row.attributes) {
                if (attr.name.startsWith('data-') && attr.name.endsWith('value') || attr.name === "id") {
                    let value = attr.value;
                    if (attr.name === 'id') {
                        value = value.replace('tr_', '');
                    }
                    rowData[attr.name.replace('data-', '').replace('-value', '')] = value;
                }
            }

            tableData[id] = rowData;
        });

        data[table.id] = tableData;
    });

    return data;
}

    const originalValues = getValues()
    document.getElementById(saveBtnId).addEventListener('click', async function () {
        const data = deepDiff(getValues(), originalValues)
        if (postIsAjax) {

            const formData = new FormData();
            formData.append('data', JSON.stringify(data));

            try {
                const response = await fetch('{$postUrl}', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    console.error('Network response was not ok');
                    return null;
                }

                if (submitRedirect) {
                    window.location.href = submitRedirectUrl;
                } else {
                    window.location.reload();
                }

            } catch (error) {
                console.error('There was a problem with the fetch operation:', error);
                return null;
            }
        } else {

            const form = document.createElement('form');
            form.setAttribute('action', postUrl);
            form.setAttribute('method', 'POST');

            const hiddenInput = document.createElement('input');
            hiddenInput.setAttribute('type', 'hidden');
            hiddenInput.setAttribute('name', 'data');
            hiddenInput.setAttribute('value', JSON.stringify(data));

            form.appendChild(hiddenInput);
            document.body.appendChild(form);
            form.submit();
        }
    });

// End JS Submit

