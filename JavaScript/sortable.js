// Start JS Sortable

/** @typedef {[]} ids */
/** @type {ids} */
function sortRowsByAttribute(rows, attribute, direction, specialCase = null, dataSelectDatalist = null) {
    return rows.sort((a, b) => {
        let aValue = a.getAttribute(attribute);
        let bValue = b.getAttribute(attribute);

        let comparison = 0;

        switch (specialCase) {
            case "select":
                const aObject = dataSelectDatalist.find(e => e.id === aValue);
                const bObject = dataSelectDatalist.find(e => e.id === bValue);
                if (aObject && bObject) {
                    comparison = aObject.name.localeCompare(bObject.name);
                } else {
                    comparison = aObject ? -1 : (bObject ? 1 : 0);
                }
                break;

            case "date":
                const aDate = new Date(aValue);
                const bDate = new Date(bValue);
                if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
                    comparison = aDate - bDate;
                } else {
                    comparison = !isNaN(aDate.getTime()) ? -1 : (!isNaN(bDate.getTime()) ? 1 : 0);
                }
                break;

            default:
                const aNumeric = !isNaN(parseFloat(aValue));
                const bNumeric = !isNaN(parseFloat(bValue));
                if (aNumeric && bNumeric) {
                    comparison = parseFloat(aValue) - parseFloat(bValue);
                } else {
                    comparison = aValue.localeCompare(bValue);
                }
                break;
        }

        return direction === "ASC" ? comparison : -comparison;
    });
}

ids.forEach(id => {
    const table = document.getElementById(id);
    const tbody = table.querySelector('tbody');
    const ths = table.querySelectorAll('th');

    const clickListener = (event) => {
        const th = event.target;
        const valueAttribute = "data-" + th.getAttribute("data-id") + "-value";

        const currentSort = th.getAttribute("data-sort")
        const columnType = th.getAttribute("data-edit-type")

        const sortDirection = currentSort === "ASC" ? "DESC" : "ASC"

        th.setAttribute("data-sort", sortDirection);

        const rows = Array.from(tbody.querySelectorAll('tr'));
        const dataSelectDatalist = columnType === "select" ? JSON.parse(table.getAttribute("data-select-datalist")) : null;

        const sortedRows = sortRowsByAttribute(rows, valueAttribute, sortDirection, columnType, dataSelectDatalist);

        const fragment = document.createDocumentFragment();
        sortedRows.forEach(row => fragment.appendChild(row));
        tbody.appendChild(fragment);
    }

    ths.forEach(th => {
        th.style.cursor = 'pointer';
        th.addEventListener('click', clickListener);
    });
});

// End JS Sortable

