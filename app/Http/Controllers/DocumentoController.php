<?php

namespace App\Http\Controllers;

use App\Models\Documento;
use App\Models\MovimientoDocumento;
use Illuminate\Http\Request;

class DocumentoController extends Controller
{
    public function descargar($id)
    {
        // Los archivos del expediente viven en dos tablas distintas:
        //   - `documentos` (polimórfico) → adjuntos de la Solicitud.
        //   - `movimiento_documentos` → adjuntos creados/respondidos en cada movimiento.
        // El frontend usa una sola ruta para ambos, así que aquí buscamos en las dos.
        $documento = Documento::find($id) ?? MovimientoDocumento::find($id);

        if (!$documento) {
            abort(404, 'El documento solicitado no existe.');
        }

        $path = storage_path('app/public/' . $documento->ruta_archivo);

        if (!file_exists($path)) {
            abort(404, 'El documento solicitado no existe en el servidor.');
        }

        $mimeType = mime_content_type($path);

        if ($mimeType === 'application/pdf') {
            return response()->file($path, [
                'Content-Type'        => 'application/pdf',
                'Content-Disposition' => 'inline; filename="' . $documento->nombre_original . '"',
            ]);
        }

        return response()->download($path, $documento->nombre_original);
    }
}
