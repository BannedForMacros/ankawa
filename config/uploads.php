<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Tipos de archivo permitidos para subida
    |--------------------------------------------------------------------------
    | Para agregar un nuevo formato, añadirlo aquí.
    | Se aplica automáticamente en todos los controladores y el frontend.
    */
    'allowed_mimes' => ['pdf', 'png', 'jpg', 'jpeg'],

    /*
    |--------------------------------------------------------------------------
    | Tamaño máximo por archivo (en MB)
    |--------------------------------------------------------------------------
    */
    'max_size_mb' => 500,
];
