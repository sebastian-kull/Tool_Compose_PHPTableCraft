<?php

namespace App\Libraries\TableCrafter\Renderers;

use InvalidArgumentException;

abstract class FieldRenderer
{
    protected string $margin = "uk-margin";
    protected string $titleLabel = "uk-form-label";
    protected string $input = "uk-input";
    protected string $formControl = "uk-form-controls";
    protected string $select = "uk-select uk-form-width-medium";
    protected string $textArea = "uk-textarea";
    protected string $label = "uk-label";
    abstract protected function view(array $options): string;
    abstract protected function edit(array $options): string;

    protected function validateOptions($expectedOptions, $options): void
    {
        foreach ($expectedOptions as $key => $expectedType) {
            if (!isset($options[$key])) {
                if ($expectedType === 'array') {
                    $options[$key] = [];
                } else {
                    throw new InvalidArgumentException("The \"{$key}\" option is required.");
                }
            } elseif (gettype($options[$key]) !== $expectedType) {
                throw new InvalidArgumentException("The \"{$key}\" option must be of type {$expectedType}.");
            }
        }
    }

}

