<?php

namespace App\Libraries\TableCrafter;


use Error;

class TableJsGenerator
{
    private string $post;
    private array $rendererClass;
    private array $tableIds;
    private string $editable;
    private string $instanceId;


    public function __construct($post, $rendererClass, $editable, $instanceId)
    {
        $this->post = $post;
        $this->rendererClass = $rendererClass;
        $this->editable = $editable;
        $this->instanceId = $instanceId;
    }

    public function generateConstData(): string
    {
        return <<<JS

// PHP Const General
    const instanceId = "{$this->instanceId}"
// PHP End General

JS;
    }

    public function generateMainScript(): string
    {

        $script = <<<JS

    // PHP Values
    const hiddenClass = "{$this->rendererClass["hidden"]}"
    const openClass = "{$this->rendererClass["open"]}" 
    const enableButtonClass = "{$this->rendererClass["button"]}"
    const disabledButtonClass = "{$this->rendererClass["disabledButton"]}"
    const enableToggle = ('{$this->editable}' === 'rw')
    // PHP Values End
    
JS;

        $filename = __DIR__ . '/JavaScript/main.js'; // Replace with the path to your file

        if (file_exists($filename)) {
            $content = file_get_contents($filename);

            $script .= $content;
        } else {
            throw new Error("File not found: $filename");
        }

        return $script;
    }

    public function getSubmitScript($saveBtnId, $redirect, $redirectUrl, $postUrl): string
    {
        $postIsAjax = intval($this->post === 'ajax');

        $script = <<<JS

    // PHP Values
    const saveBtnId = "{$saveBtnId}"
    const postIsAjax = ({$postIsAjax})
    const postUrl = "{$postUrl}"
    const submitRedirect = "{$redirect}"
    const submitRedirectUrl = "{$redirectUrl}"
    // PHP Values End
    
JS;

        $filename = __DIR__ . '/JavaScript/submit.js'; // Replace with the path to your file

        if (file_exists($filename)) {
            $content = file_get_contents($filename);

            $script .= $content;
        } else {
            throw new Error("File not found: $filename");
        }


        return $script;
    }

    public function getCancelScript($buttonId, $redirect, $url): string
    {
        $redirect = intval($redirect);

        $script = <<<JS

    // PHP Values
    let redirect = {$redirect}
    const buttonId = "{$buttonId}"
    const url = "{$url}"
    // PHP Values End
    
JS;
        $filename = __DIR__ . '/JavaScript/cancel.js'; // Replace with the path to your file

        if (file_exists($filename)) {
            $content = file_get_contents($filename);

            $script .= $content;
        } else {
            throw new Error("File not found: $filename");
        }


        return $script;
    }

    public function getSortableScript(): string
    {
        $idsJson = json_encode($this->tableIds);
        $script = <<<JS

// PHP Const Sortable Script
    const ids = {$idsJson}
// PHP End Const Sortable Script
    
JS;

        $filename = __DIR__ . '/JavaScript/sortable.js'; // Replace with the path to your file

        if (file_exists($filename)) {
            $content = file_get_contents($filename);

            $script .= $content;
        } else {
            throw new Error("File not found: $filename");
        }

        return $script;
    }


    public function getSearchableScript($searchFieldId): string
    {
        $script = <<<JS

// PHP Const Searchable Script
    const searchFieldId = "$searchFieldId"
// PHP End Const Searchable Script
    
JS;
        $filename = __DIR__ . '/JavaScript/searchable.js'; // Replace with the path to your file

        if (file_exists($filename)) {
            $content = file_get_contents($filename);

            $script .= $content;
        } else {
            throw new Error("File not found: $filename");
        }

        return $script;

    }


    public function addId(string $uniqueIdForTableId): void
    {
        $this->tableIds[] = $uniqueIdForTableId;
    }
}