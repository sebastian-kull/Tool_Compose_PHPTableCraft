// main.js

/** @typedef {string} instanceId */
/** @type {instanceId} */
/** @typedef {string} enableToggle */
/** @type {enableToggle} */
// /** @typedef {string} originalValues */
// /** @type {originalValues} */
/** @typedef {function} getValues */
/** @type {getValues} */
/** @typedef {function} deepDiff */
/** @type {deepDiff} */
/** @typedef {string} disabledButtonClass */
/** @type {disabledButtonClass} */
/** @typedef {string} enableButtonClass */
/** @type {enableButtonClass} */
/** @typedef {string} hiddenClass */
/** @type {hiddenClass} */
/** @typedef {string} openClass */
/** @type {openClass} */
;


const cellClickListener = new Set();
const elementsWithBlurListener = new Set();
const modalsWithBlurListener = new Set();
const elementsWithKeydownListener = new Set();
const modalsButtonListener = new Set();

const originalValues2 = getValues();
const saveBtn = document.querySelector('#saveBtn');


let actualOpenEditMode = null;
let escapeKeyPressed = false;
let closeModalListener;

// Main Functions
async function addLogicToEachTable() {
    const tables = document.getElementById(instanceId).querySelectorAll('table');
    const tableData = [];
    for (const table of tables) {
        const tbody = table.querySelector('tbody');
        const thead = table.querySelector('thead');

        const headerDataMap = getHeaderDataMap(table, tbody, thead, tbody);
        await processTableColumns(table, tbody, headerDataMap);
        tableData.push({
            id: table.id, headerDataMap: headerDataMap,
        });
    }
    return tableData;
}

async function processTableColumns(table, tbody, headerDataMap) {
    const numColumns = headerDataMap.size;
    const headerKeys = Array.from(headerDataMap.keys());
    const headerValues = Array.from(headerDataMap.values());

    for (let i = 0; i < numColumns; i++) {
        const currentKey = headerKeys[i];
        const currentType = headerValues[i].type;
        const currentData = headerValues[i].data;

        for (let j = 0; j < tbody.rows.length; j++) {
            const actualCell = tbody.rows[j].cells[i];

            await buildCellData(table, tbody.rows[j], actualCell, currentKey, currentType, currentData);
        }
    }
}

async function buildCellData(table, row, cell, cellKey, cellType, currentData) {
    const temp = cell.querySelector('.view-mode');
    const editMode = cell.querySelector('.edit-mode');
    const contentHolderElement = temp.querySelector('.content-holder');
    const viewMode = contentHolderElement || temp;

    const editField = await getCorrectEditField(cellType, editMode);

    let originalValue = originalValues2[table.id][row.id.replace('tr_', '')][cellKey.toLowerCase()];

    if (originalValue.startsWith('[')) {
        originalValue = JSON.parse(originalValue);
    }

    const cellData = {
        table,
        row,
        cell,
        cellKey,
        cellType,
        viewMode,
        editMode,
        editField,
        data: currentData,
        originalValue,
        actualValue: originalValue,
    };

    attachClickListener(cell, cellData);
}

// Updaters
function updateForInput(action, cellData, value) {
    if (action === 'save') {
        cellData.actualValue = value;
    } else {
        cellData.editField.value = cellData.actualValue;
    }
    return cellData.actualValue;
}

function updateForSelect(action, cellData, value) {
    const findElement = (value) => cellData.data.find(item => item.id === value);

    if (action === 'save') {
        cellData.actualValue = value;
    } else {
        cellData.editField.value = cellData.actualValue;
    }

    const matchedItem = findElement(cellData.actualValue);
    return [matchedItem.id, matchedItem.name];
}

function updateForTextArea(action, cellData) {
    if (cellData.cellType.length === 1) {
        return cellData.editField.value;
    }

    if (cellData.cellType.includes('modal') && cellData.cellType.includes('summernote')) {
        if (action === 'save') {
            cellData.actualValue = cellData.editField.innerHTML;
            return cellData.actualValue;
        } else {
            cellData.editField.innerHTML = cellData.actualValue;
            return cellData.actualValue;
        }
    }

    throw new Error('need to check this');

    // if (cellData.cellType.includes("modal")) {
    //     if (action === "save") {
    //         return cellData.editField.value;
    //     } else {
    //         return cellData.editField.innerHTML;
    //     }
    // }
    // if (cellData.cellType.includes("summernote")) {
    //     return cellData.editField.innerHTML;
    // }
}

function updateForMultipleChoice(action, cellData, value) {
    const content = cellData.editMode.querySelector('.content');
    const childNodes = content.querySelectorAll('span');
    const innerTexts = [];
    const innerHTMLs = [];
    const dataList = cellData.data;


    if (action === 'save') {
        for (let i = 0; i < childNodes.length; i++) {
            innerTexts.push(childNodes[i].innerText);
        }
        const filteredData = dataList.filter(item => innerTexts.includes(item.name));
        const idsToSave = filteredData.map(e => e.id);
        const idsToSaveStringify = JSON.stringify(idsToSave);

        for (let i = 0; i < childNodes.length; i++) {
            innerHTMLs.push(childNodes[i].outerHTML); // Push innerHTML
        }
        cellData.actualValue = idsToSave;

        return [idsToSaveStringify, innerHTMLs.join('')];
    } else {
        const fragment = document.createDocumentFragment();

        cellData.actualValue.forEach(id => {
            const matchingItem = dataList.find(item => item.id === id);
            if (matchingItem) {
                const span = createSpan(matchingItem.name);
                fragment.appendChild(span);
                innerHTMLs.push(span.outerHTML);
            }
        });

        const difference = dataList
            .filter(e => !cellData.actualValue.includes(e.id))
            .map(e => e.name);

        const dataListElement = cellData.editMode.querySelector('datalist')

        while (dataListElement.firstChild) {
            dataListElement.removeChild(dataListElement.firstChild);
        }

        difference.forEach(e => {
            const option = createOption(e);
            dataListElement.appendChild(option);
        });

        content.innerHTML = '';
        content.appendChild(fragment);

        toggleInputHiddenClass(cellData.editField)

        return [JSON.stringify(cellData.actualValue), innerHTMLs.join('')];
    }
}

function updateForDate(action, cellData, value) {
    if (action === 'save') {
        cellData.actualValue = value.split('-').reverse().join('-');
        return cellData.actualValue;
    } else {
        cellData.editField.value = cellData.actualValue.split('-').reverse().join('-');
        return cellData.actualValue;
    }
}

function getCorrectValuesFromTD(action, value, cellData) {
    let valueForRow;
    let valueForView;
    if (cellData.cellType.includes('input')) {
        valueForRow = valueForView = updateForInput(action, cellData, value);
    } else {
        switch (cellData.cellType[0]) {
            case 'select':
                [valueForRow, valueForView] = updateForSelect(action, cellData, value);
                break;
            case 'date':
                valueForRow = valueForView = updateForDate(action, cellData, value);
                break;
            case 'textarea':
                valueForRow = valueForView = updateForTextArea(action, cellData);
                break;
            case 'multipleChoice':
                [valueForRow, valueForView] = updateForMultipleChoice(action, cellData, value);
                break;
        }
    }
    return [valueForRow, valueForView];
}

// Toggles
function changeToViewMode(action, value, cellData) {

    let valueForRow;
    let valueForView;

    [valueForRow, valueForView] = getCorrectValuesFromTD(action, value, cellData);

    cellData.viewMode.innerHTML = valueForView;
    cellData.row.setAttribute('data-' + cellData.cellKey + '-value', valueForRow);

    cellData.editMode.classList.add(hiddenClass);
    cellData.viewMode.classList.remove(hiddenClass);

    actualOpenEditMode = null;
    updateSaveButtonVisibility();

}

function changeToEditMode(cellData) {
    cellData.editMode.classList.remove(hiddenClass);

    if (cellData.cellType.includes('modal')) {
        return;
    }

    cellData.viewMode.classList.add(hiddenClass);
    handleFocus(cellData);
}

function handleFocus(cellData, additional = null) {
    const type = cellData.cellType;
    if (type.length === 1) {
        switch (type[0]) {
            case 'input': {
                const temp = cellData.editField.value;
                cellData.editField.value = '';
                cellData.editField.focus();
                cellData.editField.value = temp;
            }
                break;
            default: {
                cellData.editField.focus();
            }
        }
    } else if (type.includes('modal')) {
        const textarea = additional.querySelector('textarea');
        const temp = textarea.innerHTML;
        textarea.innerHTML = '';
        textarea.focus();
        textarea.innerHTML = temp;
    }
}


// eventListener
function attachClickListener(cell, cellData) {
    if (cellClickListener.has(cell)) {
        return;
    }
    cellClickListener.add(cell);

    cell.addEventListener('click', (e) => {
        e.stopPropagation();

        // hide last open element
        if (actualOpenEditMode != null && actualOpenEditMode !== cellData) {
            changeToViewMode('save', actualOpenEditMode.editField.value, actualOpenEditMode);
        }
        actualOpenEditMode = cellData;

        changeToEditMode(cellData);

        attachBlurListener(cellData);

        attachKeyListener(cellData);

        if (cellData.cellType.includes('modal')) {

            const modal = cellData.editMode.querySelector('.modal-renderer');
            openModal(cellData, modal);
            handleFocus(cellData, modal);
            attachModalButtonListener(cellData, modal);
            attachModalBlurListener(cellData, modal);
        }
    });
}

function attachBlurListener(cellData) {
    if (elementsWithBlurListener.has(cellData.editField)) {
        return; // Already attached, no need to do it again
    }

    if (cellData.cellType.includes('multipleChoice')) {
        document.addEventListener('click', (e) => {
            if (!cellData.editMode.contains(e.target) && cellData.viewMode.classList.contains('uk-hidden')) {
                changeToViewMode('save', cellData.editField.value, cellData);
            }
        });
    } else if (!cellData.cellType.includes('modal')) {
        cellData.editField.addEventListener('blur', (e) => {
            if (!escapeKeyPressed) {
                changeToViewMode('save', e.target.value, cellData);
            }
            escapeKeyPressed = false;
        });
    }

    elementsWithBlurListener.add(cellData.editField);
}

function attachKeyListener(cellData) {
    if (elementsWithKeydownListener.has(cellData.editField)) {
        return; // Already attached, no need to do it again
    }

    cellData.editField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !['textarea', 'multipleChoice'].includes(cellData.cellType[0]) && !cellData.cellType.includes('textarea')) {
            changeToViewMode('save', e.target.value, cellData);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (actualOpenEditMode) {
                changeToViewMode('close', actualOpenEditMode.originalValue, actualOpenEditMode);
            }
            escapeKeyPressed = true;
        }
    });

    elementsWithKeydownListener.add(cellData.editField);
}

function attachModalButtonListener(cellData, modal) {
    if (modalsButtonListener.has(cellData.editField)) {
        return; // Already attached, no need to do it again
    }
    let modalButtons = modal.querySelectorAll('p button');
    modalButtons[0].addEventListener('click', () => closeModal(cellData, modal, 'close'));
    modalButtons[1].addEventListener('click', () => closeModal(cellData, modal, 'save'));
    modalsButtonListener.add(cellData.editField);
}

function attachModalBlurListener(cellData, modal) {
    if (modalsWithBlurListener.has(modal)) {
        return; // Already attached, no need to do it again
    }
    document.addEventListener('mousedown', function(event) {
        const isClickInside = modal.childNodes[1].contains(event.target);
        if (!isClickInside && modal.classList.contains('uk-open')) {
            closeModal(cellData, modal, 'close');
        }
    });
    modalsWithBlurListener.add(modal);
}

//  Modal
function closeModal(cellData, modal, action) {
    UIkit.modal(modal).hide();
    modal.remove();
    cellData.editMode.appendChild(modal);

    if (action !== 'save') {
        const textArea = cellData.editMode.querySelector('textarea');
        textArea.value = textArea.defaultValue;
    }

    const value = cellData.editField.innerText;

    changeToViewMode(action, value, cellData);

    document.removeEventListener('keydown', closeModalListener);
}

function openModal(cellData, modal) {
    UIkit.modal(modal).show();
    closeModalListener = function(event) {
        if (event.ctrlKey && event.shiftKey && event.key === 'S') {
            closeModal(cellData, modal, 'save');
        }
    };

    document.addEventListener('keydown', closeModalListener);
}


// Render Logic
function addAdditionalScript(tableDataArray) {
    const multipleChoiceSpanEventListener = createSpanEventListener();
    const multipleChoiceInputEventListener = createMultipleChoiceInputHandler(multipleChoiceSpanEventListener);

    tableDataArray.forEach(tableData => {
        tableData.headerDataMap.forEach(headerData => {
            if (headerData.type[0] === 'multipleChoice') {
                attachMultipleChoiceScript(headerData, multipleChoiceSpanEventListener, multipleChoiceInputEventListener);
            }
        });
    });
}

function createSpanEventListener() {
    return (span, dataList) => {
        span.addEventListener('mouseenter', () => {
            span.title = 'Click to delete';
        });
        span.addEventListener('mouseleave', () => {
            span.removeAttribute('title');
        });
        span.addEventListener('click', event => {
            handleSpanClick(event, dataList);
        });
    };
}

function handleSpanClick(event, dataList) {
    event.stopPropagation();
    const parent = event.target.parentNode.parentNode;
    const input = parent.querySelector('input');
    const innerText = event.target.textContent.trim();
    const optionElement = document.createElement('option');

    dataList.push(innerText);
    event.target.remove();
    input.classList.remove('uk-hidden');
    input.list.appendChild(optionElement);
    optionElement.value = innerText;
}

function createMultipleChoiceInputHandler(spanEventListener) {
    return (input, dataList, contentHolder) => {
        input.addEventListener('keyup', event => {
            handleInputKeyUp(event, input, dataList, contentHolder, spanEventListener);
        });
    };
}

function handleInputKeyUp(event, input, dataList, contentHolder, spanEventListener) {
    const value = input.value;

    if (event.key === 'Enter' && isValueInDataList(value, dataList)) {
        removeMatchingOptionFromDataList(value, input.list);
        toggleInputHiddenClass(input);
        addLabelSpanToContentHolder(value, contentHolder, spanEventListener);
        input.value = '';
    }
}

function isValueInDataList(value, dataList) {
    return dataList.some(e => e.toLowerCase() === value.toLowerCase());
}

function removeMatchingOptionFromDataList(value, dataListElement) {
    const options = dataListElement.getElementsByTagName('option');

    for (let i = 0; i < options.length; i++) {
        if (options[i].value.toLowerCase() === value.toLowerCase()) {
            dataListElement.removeChild(options[i]);
            break;
        }
    }
}

function toggleInputHiddenClass(input) {
    const options = input.list.getElementsByTagName('option');
    if (options.length === 0) {
        input.classList.add('uk-hidden');
    } else {
        input.classList.remove('uk-hidden');
    }
}

function createSpan(value) {
    const spanElement = document.createElement('span');
    spanElement.textContent = value;
    spanElement.className = 'uk-label';
    spanElement.style.backgroundColor = 'rgba(18, 95, 252, 0.8)';
    spanElement.style.textTransform = 'none';
    spanElement.style.margin = '2px';

    return spanElement;
}

function createOption(value) {
    const option = document.createElement('option')
    option.value = value
    return option;
}

function addLabelSpanToContentHolder(value, contentHolder, spanEventListener) {
    const spanElement = createSpan(value);
    spanEventListener(spanElement, contentHolder);  // Adjusted this line to pass contentHolder
    contentHolder.appendChild(spanElement);
}

function attachMultipleChoiceScript(data, spanEventListener, multipleChoiceInputEventListener) {
    data.htmlElements.forEach(td => {
        const row = td.parentNode;
        const contentHolder = td.querySelector('.input-container .content');
        const input = td.querySelector('input');
        const selectedElements = JSON.parse(row.getAttribute(`data-${td.getAttribute('data-column_id')}-value`));
        const dataList = data.data.filter(e => !selectedElements.includes(e.id)).map(e => e.name);

        contentHolder.querySelectorAll('span').forEach(span => {
            spanEventListener(span, dataList);  // dataList is now being passed here
        });

        multipleChoiceInputEventListener(input, dataList, contentHolder);  // dataList is now being passed here
    });
}

// Helpers
function getTdElementsForTh(table, tbody, th) {
    const columnIndex = th.cellIndex;
    const tdElements = [];
    const rowCount = tbody.rows.length;

    for (let i = 0; i < rowCount; i++) {
        const row = tbody.rows[i];
        const td = row.cells[columnIndex];
        if (td) {
            tdElements.push(td);
        }
    }

    return tdElements;
}


async function getCorrectEditField(type, editMode) {
    return new Promise((resolve) => {
        if (type.some(t => ['input', 'date'].includes(t))) {
            resolve(editMode.querySelector('input'));
        } else if (type.includes('select')) {
            resolve(editMode.querySelector('select'));
        } else if (type.includes('textarea')) {
            if (type.length === 1) {
                resolve(editMode.querySelector('textarea'));
            } else if (type.includes('summernote')) {
                createObserver(editMode, resolve);
            } else if (type.includes('modal')) {
                resolve(editMode.querySelector('textarea'));
            }
        } else if (type.includes('multipleChoice')) {
            resolve(editMode.querySelector('input'));
        } else {
            resolve(editMode.querySelector('input'));
        }
    });
}

function getHeaderDataMap(table, tbody, thead) {
    const tableHeadElements = thead.querySelectorAll('th');
    const headerDataMap = new Map();

    tableHeadElements.forEach(th => {
        const rowId = th.getAttribute('data-id');
        const type = parseType(th.getAttribute('data-edit-type'));
        const data = getDataForType(table, type, rowId);
        const htmlElements = getTdElementsForTh(table, tbody, th);

        headerDataMap.set(rowId, {
            type, data, htmlElements,
        });
    });

    return headerDataMap;
}

function parseType(unparsedType) {
    return unparsedType.startsWith('[') ? JSON.parse(unparsedType) : [unparsedType];
}

function updateSaveButtonVisibility() {
    const dataHasChanged = Object.keys(deepDiff(getValues(), originalValues2)).length > 0;

    if (dataHasChanged) {
        saveBtn.className = saveBtn.className.replace(disabledButtonClass, enableButtonClass);
        saveBtn.disabled = false;
    } else {
        saveBtn.className = saveBtn.className.replace(enableButtonClass, disabledButtonClass);
        saveBtn.disabled = true;
    }
}

function createObserver(editMode, resolve) {
    const observer = new MutationObserver(async (mutationsList, observer) => {
        for (const mutation of mutationsList) {
            if (mutation.addedNodes) {
                for (const node of mutation.addedNodes) {
                    if (node.querySelector) {
                        const mutatedElement = node.querySelector('.note-editable');
                        if (mutatedElement) {
                            observer.disconnect();
                            resolve(mutatedElement);
                            return;
                        }
                    }
                }
            }
        }
    });

    observer.observe(editMode, { childList: true, subtree: true });
}

function getDataForType(table, type, rowKey) {
    if (['select', 'multipleChoice'].includes(type[0])) {
        return JSON.parse(table.getAttribute('data-' + rowKey + '-dataList'));
    }
}


if (enableToggle) {
    const tableDataArray = await addLogicToEachTable();
    addAdditionalScript(tableDataArray);
}

// end main.js
