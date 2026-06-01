<?php

namespace App\Http\Controllers;

use App\Support\DocumentoAcceso;

class DocumentoController extends Controller
{
    /**
     * Descarga autorizada de un documento de expediente (staff / solicitante autenticado).
     *
     * Los archivos viven en el disco PRIVADO `documentos`; aquí se valida que el
     * usuario tenga derecho a ver el documento (alcance global, participación en
     * el expediente o ser el propio solicitante) antes de servirlo.
     */
    public function descargar($id)
    {
        $documento = DocumentoAcceso::resolver($id);
        abort_unless($documento, 404, 'El documento solicitado no existe.');

        abort_unless(
            DocumentoAcceso::usuarioPuedeVer($documento, auth()->user()),
            403,
            'No tiene acceso a este documento.'
        );

        return DocumentoAcceso::servir($documento);
    }
}
