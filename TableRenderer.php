<?php

namespace App\Libraries\TableCrafter;

class TableRenderer
{
    public function getHoverStyle(): string
    {
        return '<style>td:hover {cursor: pointer;}</style>';
    }

    public function renderButton(string $class, string $id, string $text): string
    {
        return "<button class='{$class}' id='{$id}'>{$text}</button>";
    }

    public function renderInput(string $class, string $id): string
    {
        return "<input class='{$class}' id='{$id}'>";
    }

    public function renderScriptTag(string $data): string
    {
        return "<script>{$data}</script>";
    }

    public function renderElement(string $tag, string $content, array $attributes = []): string
    {
        $attrString = '';
        foreach ($attributes as $key => $value) {
            $attrString .= " {$key}=\"{$value}\"";
        }

        return "<{$tag}{$attrString}>{$content}</{$tag}>";
    }

    public function renderOpenTableWrapper(string $id): string
    {
        return "<div id=\"{$id}\">";
    }

    public function renderCloseTableWrapper(): string
    {
        return '</div>';
    }

    public function addDOMContentLoaded(string $script): string
    {
        return <<<JS

document.addEventListener('DOMContentLoaded', async function() {
{$script}
})
        
JS;
    }
}
