<?php

namespace App\Libraries\TableCrafter\Renderers\Elements;

use App\Libraries\TableCrafter\Renderers\FieldRenderer;

class TextArea extends FieldRenderer
{
    public function view(array $options): string
    {
        $this->validateOptions(['value' => 'string'], $options);


        $value = $options['value'];

        if (isset($options['wrapper']) && is_callable($options['wrapper'])) {
            return $options['wrapper']($value);
        }

        return $value;
    }

    public function edit(array $options): string
    {
        $this->validateOptions(['value' => 'string'], $options);


        $value = $options['value'];
        $rows = $options['rows'] ?? 10;
        $cols = $options['cols'] ?? 50;
        $id = uniqid();

        $isSummernote = isset($options['summernote']) && $options['summernote'];
        $isModal = isset($options['modal']) && $options['modal'];

        $class = $isSummernote ? "" : $this->textArea;

        $textareaField = "<textarea name='textarea' id='{$id}' class='{$class}' rows='{$rows}' cols='{$cols}'>{$value}</textarea>";

        if ($isModal) {
            $textareaField = "
                <div data-uk-modal class=\"uk-modal modal-renderer\" style=\"display: block;\" tabindex=\"-1\">
                    <div class='uk-modal-dialog uk-modal-body'>
                        <h2 class='uk-modal-title'>Edit Text</h2>
                        <div>
                        {$textareaField}
                        </div>
                        <p class='uk-text-right'>
                            <button class='uk-button uk-button-default' type='button'>Cancel</button>
                            <button class='uk-button uk-button-primary' type='button'>Save</button>
                        </p>
                    </div>
                </div>
        ";
        }

        if ($isSummernote) {
            $script = <<<JS
$(document).ready(function() {
    $('#{$id}').summernote({
        tabsize: 2,
        height: 200,
        toolbar: [
            ["style", ["style"]],
            ["font", ["bold", "underline", "clear"]],
            ["color", ["color"]],
            ["para", ["ul", "ol", "paragraph"]],
            ["table", ["table"]],
            ["insert", ["link", "picture"]],
            ["view", ["fullscreen", "codeview", "help"]]
        ]
    });
});
JS;
            $textareaField .= '<script>' . $script . '</script>';
        }

        return $textareaField;
    }
}