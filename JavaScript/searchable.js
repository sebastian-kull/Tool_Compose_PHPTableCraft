// searchable.js

/** @typedef {string} instanceId */
/** @type {instanceId} */
/** @typedef {string} searchFieldId */
/** @type {searchFieldId} */
;

const instance = document.getElementById(instanceId);
const tables = Array.from(instance.querySelectorAll('table'));
let rowsData = [];
let searchTerm = '';
function initialize() {
    tables.forEach(table => {
        const tableHeadElements = Array.from(table.querySelectorAll('th'));
        const types = tableHeadElements.map(th => parsePropsValue(th.getAttribute('data-edit-type'))[0]);
        const tableRowElements = Array.from(table.querySelectorAll('tbody > tr'));
        tableRowElements.forEach(tr => {
            const tableDataElements = Array.from(tr.querySelectorAll('td'));
            const stringArray = types.map((type, i) => {
                const key = tableDataElements[i].getAttribute('data-column_id');
                const value = tr.getAttribute('data-' + key + '-value');
                return convertValueToSearchableValue(table, value, type, key);
            });
            rowsData.push({ table, row: tr, data: stringArray.join(" ").toLowerCase() });
        });
    });
}
function convertValueToSearchableValue(table, value, type, key) {
    switch (type) {
        case 'input':
            return value
        case 'date':
            return value.split('-').reverse().join('-');
        case 'select':
            return getDataList(table, key).find(e => e.id === value).name;
        case 'multipleChoice':
            return getDataList(table, key)
                .filter(data => value.includes(data.id))
                .map(data => data.name).join(" ")
        default:
            return value
    }
}
function parsePropsValue(unparsedType) {
    return unparsedType.startsWith('[ ') ? JSON.parse(unparsedType) : [unparsedType]
}
function applyFilters(e) {
    searchTerm = e.target.value.toLowerCase();
    filterRows();
}
function filterRows() {
    rowsData.forEach(row => {
        const element = row.row;
        if (row.data.includes(searchTerm)) {
            element.classList.remove('uk-hidden');  // Show the row by removing 'uk-hidden' class
        } else {
            element.classList.add('uk-hidden');  // Hide the row by adding 'uk-hidden' class
        }
    });
}

function getDataList(table, key) {
    return JSON.parse(table.getAttribute("data-" + key + "-datalist"))
}

document.getElementById(searchFieldId).addEventListener('input', applyFilters);
initialize();

// end searchable.js
