<?php

namespace App\Libraries\TableCrafter\Renderers\Elements;

use App\Libraries\TableCrafter\Renderers\FieldRenderer;

class MultipleChoice extends FieldRenderer
{

    public function view($options): string
    {
        $this->validateOptions(['object' => 'array', 'dataList' => 'array'], $options);

        $ids = $options['object']['ids'] ?? [];
        $dataList = $options['dataList'] ?? [];

        return $this->generateSpansForMultipleChoice($ids, $dataList);
    }

    public function edit($options): string
    {
        $this->validateOptions(['object' => 'array', 'dataList' => 'array'], $options);

        $ids = $options['object']['ids'] ?? [];
        $dataList = $options['dataList'] ?? [];

        $spanContent = $this->generateSpansForMultipleChoice($ids, $dataList);
        $preparedDatalist = $this->removeFromDatalistByIds($ids, $dataList);
        $dataListContent = $this->createDataList($preparedDatalist, "name");

        return "
            <div class=\"uk-textarea\">
                <div class=\"input-container\">
                    <div class=\"content\">
                    {$spanContent}
                        
                    </div>
                    
                    <label>
                        <input name='searchField' autocomplete=\"on\" list=\"{$options["id"]}-datalist\" style='outline: none'>
                    </label>
                    <datalist id=\"{$options["id"]}-datalist\">
                        {$dataListContent}
                    </datalist>
                </div>
            </div>
        ";

    }

    private function generateSpansForMultipleChoice($ids, $dataList): string
    {
        $idNameMap = [];

        foreach ($dataList as $element) {
            $idNameMap[$element['id']] = $element['name'];
        }

        $stringBuilder = '';
        $style = 'background-color: rgba(18,95,252,0.8); text-transform: none; margin: 2px;';

        foreach ($ids as $id) {
            if (isset($idNameMap[$id])) {
                $name = $idNameMap[$id];

                $stringBuilder .= "<span class='{$this->label}' style='{$style}' >
                    {$name}
                </span>";
            }
        }

        return $stringBuilder;
    }
    private function removeFromDatalistByIds($idsToRemove, $datalist){
        foreach ($idsToRemove as $idToRemove) {
            foreach ($datalist as $key => $item) {
                if ($item['id'] === $idToRemove) {
                    unset($datalist[$key]);
                    break; // Exit the loop once the item is removed
                }
            }
        }

        return $datalist;
    }
    private function createDataList($dataList, $key): string
    {
        $dataListContent = [];

        foreach ($dataList as $data) {
            $dataListContent[] = sprintf('<option value="%s"></option>', htmlspecialchars($data[$key]));
        }
        return implode('', $dataListContent);
    }

}