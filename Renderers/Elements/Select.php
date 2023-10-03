<?php

namespace App\Libraries\TableCrafter\Renderers\Elements;

use App\Libraries\TableCrafter\Renderers\FieldRenderer;

class Select extends FieldRenderer
{

    public function view(array $options): string
    {
        $this->validateOptions(['object' => 'array', 'dataList' => 'array'], $options);

        $object = $options['object'];
        $dataList = $options['dataList'];
        $wrapper = $options['wrapper'] ?? null;

        $selectedData = array_filter($dataList, fn($data) => $object["id"] === $data["id"]);
        $selectedName = $selectedData ? reset($selectedData)['name'] : null;

        $html = $selectedName ?? '';

        return $wrapper ? $wrapper($html) : $html;
    }

    public function edit(array $options): string
    {
        $this->validateOptions(['object' => 'array', 'dataList' => 'array'], $options);

        $object = $options['object'];
        $dataList = $options['dataList'];
        $wrapper = $options['wrapper'] ?? null;
        $optionStyle = $options['optionStyle'] ?? null;
        $selectClass = $options['selectClass'] ?? $this->select;
        $selectedId = $object['id'] ?? null;

        $optionsHtml = array_fill(0, count($dataList), '');

        foreach ($dataList as $data) {
            $optionsHtml[] = sprintf(
            /** @lang text */ '<option style="%s" %s value="%s">%s</option>',
                $optionStyle ? $optionStyle($data) : '',
                ($selectedId === $data['id']) ? 'selected' : '',
                $data['id'],
                $data['name']
            );
        }

        $html = sprintf(
            '<select class="%s" data-id="{$object}" name="data[asset_type]">%s</select>',
            $selectClass,
            implode('', $optionsHtml)
        );

        return $wrapper ? $wrapper($html) : $html;
    }
}