<?php
$token = \App\Models\AdminAccount::first()->createToken('curl')->plainTextToken;
echo "TOKEN_START" . $token . "TOKEN_END\n";
