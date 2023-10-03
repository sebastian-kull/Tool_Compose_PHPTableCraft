<?php

namespace App\Libraries\TableCrafter\Renderers\Elements;

use App\Libraries\TableCrafter\Renderers\FieldRenderer;

class Date extends FieldRenderer
{

    public function view(array $options): string
    {
        return $options[0];
    }

    public function edit(array $options): string
    {
        $value = $options['val'] ?? '';
        $min = $options['min'] ?? '';
        $max = $options['max'] ?? '';
        $class = "uk-input";

        return "<input name='date' class='{$class}' type='date' value='{$value}' min='{$min}' max='{$max}' />";
    }
}