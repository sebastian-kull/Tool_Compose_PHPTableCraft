<?php

namespace App\Libraries\TableCrafter\Renderers;

use App\Libraries\TableCrafter\Renderers\Elements\Date;
use App\Libraries\TableCrafter\Renderers\Elements\Input;
use App\Libraries\TableCrafter\Renderers\Elements\MultipleChoice;
use App\Libraries\TableCrafter\Renderers\Elements\Select;
use App\Libraries\TableCrafter\Renderers\Elements\TextArea;
use InvalidArgumentException;

class FieldRendererFactory
{
    private Input $input;
    private MultipleChoice $multipleChoice;
    private Date $date;
    private Select $select;
    private TextArea $textArea;

    public function __construct()
    {
        $this->input = new Input();
        $this->multipleChoice = new MultipleChoice();
        $this->date = new Date();
        $this->select = new Select();
        $this->textArea = new TextArea();
    }

    public function getRenderer($case): FieldRenderer
    {
        if (gettype($case) === "array") {
            $case = $case[0];
        }
        return match ($case) {
            'input' => $this->input,
            'multipleChoice' => $this->multipleChoice,
            'date' => $this->date,
            'select' => $this->select,
            'textarea' => $this->textArea,
            default => throw new InvalidArgumentException("wrong renderer type: {$case}"),
        };
    }


}