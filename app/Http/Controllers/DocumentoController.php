<?php

namespace App\Http\Controllers;

use App\Models\Documento;
use Illuminate\Http\Request;

class DocumentoController extends Controller
{
    public function descargar(Documento $documento)
    {
        // 1. Obtener la ruta absoluta del archivo
        $path = storage_path('app/public/' . $documento->ruta_archivo);

        // 2. Verificar si el archivo existe físicamente
        if (!file_exists($path)) {
            abort(404, 'El documento solicitado no existe en el servidor.');
        }

        // 3. Detectar qué tipo de archivo es (MIME type)
        $mimeType = mime_content_type($path);

        // 4. Si es un PDF, le decimos al navegador que lo muestre en pantalla (inline)
        if ($mimeType === 'application/pdf') {
            return response()->file($path, [
                'Content-Type'        => 'application/pdf',
                // 'inline' le dice al navegador que lo dibuje. Le pasamos el nombre original por si el usuario decide guardarlo desde el visor.
                'Content-Disposition' => 'inline; filename="' . $documento->nombre_original . '"'
            ]);
        }

        // 5. Si es cualquier otra cosa (Word, Imagen, etc.), forzamos la descarga (attachment)
        return response()->download($path, $documento->nombre_original);
    }
}