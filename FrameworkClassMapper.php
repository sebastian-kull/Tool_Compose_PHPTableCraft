<?php

namespace App\Libraries\TableCrafter;

use InvalidArgumentException;

class FrameworkClassMapper
{
    private string $frameWorkName;
    private const FRAMEWORK_CONVERSION_MAPS = [
        'uiKit' => [
            'basic' => [
                'hidden' => 'uk-hidden',
                'open' => 'uk-open',
                'input' => 'uk-input',
                'button' => 'uk-button uk-button-primary',
                'disabledButton' => 'uk-button uk-button-default uk-disabled',
                'cancelButton' => 'uk-button uk-button-secondary',
            ],
            'extended' => [
                'table' => 'uk-table',
                'table-hover' => 'uk-table-hover',
                'table-divider' => 'uk-table-divider',
                'table-small' => 'uk-table-small',
            ]
        ]
    ];

    public function __construct(?string $frameWorkName = null)
    {
        if ($frameWorkName) {
            $this->setType($frameWorkName);
        }
    }

    public function setType(string $frameWorkName): void
    {
        if (!isset(self::FRAMEWORK_CONVERSION_MAPS[$frameWorkName])) {
            throw new InvalidArgumentException("Unsupported framework: {$frameWorkName}");
        }
        $this->frameWorkName = $frameWorkName;
    }

    public function basicClassConverter(): array
    {
        $conversionMap = $this->getFrameworkConversionMap();
        if (empty($conversionMap['basic'])) {
            throw new InvalidArgumentException("Basic styles not defined for framework: {$this->frameWorkName}");
        }
        return $conversionMap['basic'];
    }

    public function classConverter(string $classes): string
    {
        $conversionMap = $this->getFrameworkConversionMap();
        if (empty($conversionMap['extended'])) {
            throw new InvalidArgumentException("Extended styles not defined for framework: {$this->frameWorkName}");
        }
        return $this->convertClasses(explode(' ', $classes), $conversionMap['extended']);
    }

    private function convertClasses(array $classes, array $conversionRules): string
    {
        return implode(" ", array_filter(array_map(fn ($class) => $conversionRules[$class] ?? null, $classes)));
    }

    private function getFrameworkConversionMap(): array
    {
        return self::FRAMEWORK_CONVERSION_MAPS[$this->frameWorkName] ?? [];
    }
}
