<?php

namespace App\Libraries\TableCrafter;

use App\Libraries\TableCrafter\Renderers\FieldRendererFactory;
use Closure;
use InvalidArgumentException;

class TableGenerator
{
    private string $class;
    private array $columnConfig;
    private array $data;
    private string $editable;
    private bool $isEditable;
    private bool $searchable;
    private bool $sortable;
    private string $htmlBuilder = "";
    private string $instanceId;

    private string $style;
    private array $rendererClass;
    private string $tableId;

    private FieldRendererFactory $fieldRendererFactory;
    private FrameworkClassMapper $frameworkClassMapper;
    private TableJsGenerator $tableJsGenerator;
    private TableRenderer $tableTagRenderer;
    private array $onCancel;
    private array $onSubmit;

    public function __construct(array $params)
    {

        $this->frameworkClassMapper = new FrameworkClassMapper();
        $this->fieldRendererFactory = new FieldRendererFactory();
        $this->tableTagRenderer = new TableRenderer();
        $this->instanceId = uniqid();



        $this->initializeDefaultValues($params);
        $this->setStyleMapper($params);
        $this->tableJsGenerator = new TableJsGenerator(
            $params['log'] ?? false,
            $this->rendererClass,
            $this->editable,
            $this->instanceId
        );
    }

    public function addTable(array $params): void
    {
        $this->validateRequiredProperties($params, ['id', 'columnConfig', 'data']);

        $uniqueIdForTableId = uniqid() . '-' . $params['id'];
        $this->tableId = $uniqueIdForTableId;
        $this->columnConfig = $params['columnConfig'];
        $this->data = $params['data'];
        $this->style = $params['style'] ?? '';

        if (key_exists('tableClass', $params)) {
            $tableClassConfig = $params['tableClass'];
            $this->validateAndSetFrameworkType($tableClassConfig, ["type", "classes"], 'tableClass');
            $this->class = $this->frameworkClassMapper->classConverter($tableClassConfig['classes']);
        } else {
            $this->class = '';
        }

        $this->tableJsGenerator->addId($uniqueIdForTableId);
        $this->htmlBuilder .= $this->generateTable();
    }

    public function addSearchable(): void
    {
        $this->searchable = true;
    }

    public function addSortable(): void{
        $this->sortable = true;
    }

    public function render(): string
    {
        $searchFieldId = "searchFieldId";

        $script = $this->tableJsGenerator->generateConstData();

        if ($this->searchable) {
            $this->htmlBuilder .= $this->tableTagRenderer->renderInput($this->rendererClass["input"], $searchFieldId);
            $script .= $this->tableJsGenerator->getSearchableScript($searchFieldId);
        }

        if ($this->isEditable) {
            $cancelBtnId = "cancelBtn";
            $saveBtnId = "saveBtn";

            $this->htmlBuilder .= $this->tableTagRenderer->renderButton($this->rendererClass["disabledButton"], $saveBtnId, 'Save Changes');
            $this->htmlBuilder .= $this->tableTagRenderer->renderButton($this->rendererClass["cancelButton"], $cancelBtnId, 'Cancel');

            if ($this->editable === "rw") {
                $script .= $this->tableJsGenerator->generateMainScript();

            }

            $script .= $this->tableJsGenerator->getSubmitScript($saveBtnId, $this->onSubmit["redirect"], $this->onSubmit["redirectUrl"] ?? null, $this->onSubmit["postUrl"] ?? null,);
            $script .= $this->tableJsGenerator->getCancelScript($cancelBtnId, $this->onCancel["redirect"], $this->onCancel["redirectUrl"]);
        }

        if ($this->sortable) {
            $script .= $this->tableJsGenerator->getSortableScript();
        }

        $temp = $this->tableTagRenderer->addDOMContentLoaded($script);
        $this->htmlBuilder .= $this->tableTagRenderer->renderScriptTag($temp);
        $this->htmlBuilder .= $this->tableTagRenderer->renderCloseTableWrapper();
        return $this->htmlBuilder;
    }


//  Generators
    private function generateTable(): string
    {
        $propsCollector = [];
        foreach ($this->columnConfig as $rowConfig) {
            $this->validateRequiredProperties($rowConfig, ['html']);
            if (key_exists("tableProps", $rowConfig["html"])) {
                foreach ($rowConfig["html"]["tableProps"] as $key => $value) {
                    if ($key == 'dataList') {
                        $value = htmlspecialchars(json_encode($value), ENT_QUOTES, 'UTF-8');
                    }
                    $propsCollector[sprintf("data-%s-%s", $rowConfig["id"], $key)] = $value;
                }
            }
        }

        $propsCollector["id"] = $this->tableId;
        $propsCollector["class"] = $this->class;
        $propsCollector["style"] = $this->style;

        $table = $this->tableTagRenderer->renderElement("table", $this->generateTableHead() . $this->tableTagRenderer->renderElement("tbody", $this->generateTableRows()), $propsCollector);

        $style = ($this->editable === "rw") ? $this->tableTagRenderer->getHoverStyle() : '';


        return $table . $style;
    }

    private function generateTableHead(): string
    {
        $headRow = array_map(function($element) {
            $this->validateRequiredProperties($element, ['editType', 'columnTitle']);
            $editType = is_array($element['editType']) ? htmlspecialchars(json_encode($element['editType']), ENT_QUOTES, 'UTF-8') : $element['editType'];
            return $this->tableTagRenderer->renderElement("th", $element['columnTitle'], [
                'style' => $element['style'] ?? null,
                'class' => $element['class'] ?? null,
                'id' => "thead_{$element['id']}",
                'data-id' => "{$element['id']}",
                "data-edit-type" => $editType,
            ]);
        }, $this->columnConfig);

        return $this->tableTagRenderer->renderElement("thead", $this->tableTagRenderer->renderElement("tr", implode('', $headRow)));
    }

    private function generateTableRows(): string
    {
        return implode('', array_map(fn($element) => $this->generateTableRow($element["id"], $element), $this->data));
    }

    private function generateTableRow($rowKey, $element): string
    {
        $rowContent = [];

        $rowId = $element["id"];

        foreach ($this->columnConfig as $column) {
            $cellContent = $this->generateCellContent($column, $element);
            $rowContent[] = $this->tableTagRenderer->renderElement("td", $cellContent, [
                "data-column_id" => $column["id"],
            ]);
        }

        $dataAttributes = [
            "id" => "tr_{$rowKey}",
            "data-row_id" => $rowId
        ];

        if ($this->isEditable || $this->sortable) {
            foreach ($this->columnConfig as $column) {
                foreach ($column["html"]["values"] as $key => $valueOrFunction) {
                    if (is_callable($valueOrFunction) && ($valueOrFunction instanceof Closure)) {
                        $value = $valueOrFunction($element);
                    } elseif (is_array($valueOrFunction)) {
                        $value = json_encode($valueOrFunction);
                    } else {
                        $value = $valueOrFunction;
                    }
                    $dataAttributes["data-{$column['id']}-{$key}"] = htmlspecialchars($value);
                }
            }
        }
        return $this->tableTagRenderer->renderElement("tr", implode('', $rowContent), $dataAttributes);
    }

    private function generateCellContent($column, $element): string
    {
        $render = $this->fieldRendererFactory->getRenderer($column['editType']);

        $viewContent = $this->tableTagRenderer->renderElement(
            'div',
            $render->view($column["html"]["view"]($element)),
            ['class' => 'view-mode']
        );

        $editClass = "edit-mode" . ($this->editable === "w" ? "" : " uk-hidden");
        $editContent = $this->tableTagRenderer->renderElement(
            'div',
            $render->edit($column["html"]["edit"]($element)),
            ['class' => $editClass]
        );


        return ($this->editable === "r" || $this->editable === "rw" ? $viewContent : '') .
            ($this->editable === "w" || $this->editable === "rw" ? $editContent : '');
    }

//  Helpers
    private function initializeDefaultValues($params): void
    {
        $this->editable = $params['editable'] ?? 'r';
        $isEditable = ($this->editable === "rw" || $this->editable === "w");

        if ($isEditable) {
            $this->validateRequiredProperties($params, ["onSubmit", "onCancel"], 'editable');
            if ($params["post"] == "ajax") {
                $this->validateRequiredProperties($params["onSubmit"], ["postUrl", "redirect"], 'editable.onSubmit');
                if ($params["onSubmit"]["redirect"]) {
                    $this->validateRequiredProperties($params["onSubmit"], ["redirectUrl"], 'editable.onSubmit.redirectUrl');
                }
            }

            $this->onCancel = $params["onCancel"];
            $this->onSubmit = $params["onSubmit"];
        }

        $this->isEditable = $isEditable;
        $this->sortable = $params['sortable'] ?? false;
        $this->searchable = $params['searchable'] ?? false;
        $this->htmlBuilder .= $this->tableTagRenderer->renderOpenTableWrapper($this->instanceId);
    }

    private function setStyleMapper($params): void
    {
        $rendererClassKey = 'rendererClass';

        if (!key_exists($rendererClassKey, $params)) {
            throw new InvalidArgumentException("Please add existing rendererClass values to the constructor");
        }

        $tableClassConfig = $params[$rendererClassKey];
        $this->validateAndSetFrameworkType($tableClassConfig, ["type"], $rendererClassKey);
        $this->rendererClass = $this->frameworkClassMapper->basicClassConverter();

    }

    private function validateAndSetFrameworkType($tableClassConfig, array $requiredProps, string $key): void
    {
        $this->validateRequiredProperties($tableClassConfig, $requiredProps, $key);
        $this->frameworkClassMapper->setType($tableClassConfig["type"]);
    }

    private function validateRequiredProperties(array $params, array $requiredProperties, string $where = null): void
    {
        $errorMessage = '';

        if ($where !== null) {
            $errorMessage = " in '{$where}'";
        }

        $missingProperties = [];

        foreach ($requiredProperties as $property) {
            if (!isset($params[$property])) {
                $missingProperties[] = $property;
            }
        }

        if (!empty($missingProperties)) {
            $missingPropertiesStr = implode(', ', $missingProperties);
            throw new InvalidArgumentException("The following parameter(s) are required{$errorMessage} in the table configuration array: {$missingPropertiesStr}");
        }
    }
}
