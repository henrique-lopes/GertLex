<?php

namespace App\Exceptions;

use Exception;

class QuotaExceededException extends Exception
{
    public function render($request)
    {
        if ($request->wantsJson()) {
            return response()->json(['error' => $this->getMessage()], 422);
        }

        return back()->with('error', $this->getMessage());
    }
}
