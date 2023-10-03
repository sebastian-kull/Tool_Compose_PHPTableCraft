<?php

namespace App\Libraries\TableCrafter\Renderers\Elements;

use App\Libraries\TableCrafter\Renderers\FieldRenderer;
use InvalidArgumentException;

class Input extends FieldRenderer
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

        $type = $options['type'] ?? 'text';

        if (!in_array($type, ['text', 'password', 'email', 'number'])) {
            throw new InvalidArgumentException('Invalid input type: ' . $type . ' provided.');
        }

        $inputField = "<input name='input' class='{$this->input}' type='{$type}' value='{$value}' />";

        if (isset($options['wrapper']) && is_callable($options['wrapper'])) {
            return $options['wrapper']($inputField);
        }

        return $inputField;
    }
}