<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Spatie\PdfToImage\Pdf;
use Intervention\Image\Facades\Image;

class MesaPartesController extends Controller
{
    public function index()
    {
        return Inertia::render('MesaPartes/Index');
    }

    public function storeSolicitudArbitraje(Request $request)
    {
        $validated = $request->validate([
            'tipo_persona' => 'required|in:natural,juridica',
            'nombre_demandante' => 'required_if:tipo_persona,natural|string|max:255',
            'dni_demandante' => 'required_if:tipo_persona,natural|string|max:8',
            'razon_social' => 'required_if:tipo_persona,juridica|string|max:255',
            'ruc' => 'required_if:tipo_persona,juridica|string|max:11',
            'nombre_representante' => 'nullable|string|max:255',
            'dni_representante' => 'nullable|string|max:8',
            'domicilio' => 'required|string',
            'email' => 'required|email',
            'telefono' => 'required|string',
            'celular' => 'nullable|string',
            'nombre_demandado' => 'required|string',
            'datos_notificacion_demandado' => 'required|string',
            'resumen_controversia' => 'required|string',
            'pretensiones' => 'required|string',
            'monto' => 'nullable|string',
            'nombre_arbitro' => 'required|string',
            'email_arbitro' => 'required|email',
            'domicilio_arbitro' => 'required|string',
            'forma_designacion' => 'required|string',
            'reglas_aplicables' => 'nullable|string',
            'aceptacion_reglamento' => 'accepted',
            'convenio_arbitral' => 'required|file|mimes:pdf|max:102400',
            'poder_representante' => 'nullable|file|mimes:pdf|max:102400',
            'medida_cautelar' => 'nullable|file|mimes:pdf|max:102400',
            'comprobante_pago' => 'required|file|mimes:pdf,jpg,jpeg,png|max:102400',
        ]);

        // Generar número de expediente
        $numeroExpediente = 'ARB-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);

        // Crear directorio para el expediente
        $directorio = 'expedientes/' . $numeroExpediente;

        // Guardar archivos
        if ($request->hasFile('convenio_arbitral')) {
            $validated['convenio_arbitral_path'] = $request->file('convenio_arbitral')->store($directorio);
        }

        if ($request->hasFile('poder_representante')) {
            $validated['poder_representante_path'] = $request->file('poder_representante')->store($directorio);
        }

        if ($request->hasFile('medida_cautelar')) {
            $validated['medida_cautelar_path'] = $request->file('medida_cautelar')->store($directorio);
        }

        if ($request->hasFile('comprobante_pago')) {
            $validated['comprobante_pago_path'] = $request->file('comprobante_pago')->store($directorio);
        }

        // Aquí guardarías en la base de datos
        // SolicitudArbitraje::create([...]);

        return redirect()->route('mesa-partes.index')->with([
            'success' => 'Solicitud de arbitraje enviada correctamente',
            'numero_expediente' => $numeroExpediente,
        ]);
    }

    public function storeApersonamiento(Request $request)
    {
        $validated = $request->validate([
            'numero_expediente' => 'required|string',
            'razon_social' => 'required|string|max:255',
            'ruc' => 'required|string|max:11',
            'datos_registrales' => 'required|string',
            'nombre_representante' => 'required|string|max:255',
            'dni_representante' => 'required|string|max:8',
            'domicilio' => 'required|string',
            'telefono' => 'required|string',
            'celular' => 'nullable|string',
            'email' => 'required|email',
            'resumen_posicion' => 'required|string',
            'pretensiones' => 'nullable|string',
            'monto' => 'nullable|string',
            'nombre_arbitro' => 'required|string',
            'email_arbitro' => 'required|email',
            'domicilio_arbitro' => 'required|string',
            'forma_designacion' => 'required|string',
            'reglas_aplicables' => 'nullable|string',
            'oposicion_inicio' => 'boolean',
            'motivo_oposicion' => 'required_if:oposicion_inicio,true|nullable|string',
            'aceptacion_reglamento' => 'accepted',
            'poder_representante' => 'required|file|mimes:pdf|max:102400',
            'comprobante_pago' => 'required|file|mimes:pdf,jpg,jpeg,png|max:102400',
        ]);

        // Crear directorio para el apersonamiento
        $directorio = 'expedientes/' . $validated['numero_expediente'] . '/apersonamiento';

        // Guardar archivos
        if ($request->hasFile('poder_representante')) {
            $validated['poder_representante_path'] = $request->file('poder_representante')->store($directorio);
        }

        if ($request->hasFile('comprobante_pago')) {
            $validated['comprobante_pago_path'] = $request->file('comprobante_pago')->store($directorio);
        }

        // Aquí guardarías en la base de datos
        // Apersonamiento::create([...]);

        return redirect()->route('mesa-partes.index')->with([
            'success' => 'Respuesta/Apersonamiento enviado correctamente',
            'numero_expediente' => $validated['numero_expediente'],
        ]);
    }

    public function compressFiles(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf|max:512000', // Máximo 500MB para compresión
        ]);

        $file = $request->file('file');
        $tempPath = $file->store('temp');
        $fullPath = Storage::path($tempPath);

        try {
            // Usar Ghostscript para comprimir PDF
            $outputPath = Storage::path('temp/compressed_' . basename($tempPath));
            
            $command = sprintf(
                'gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile=%s %s',
                escapeshellarg($outputPath),
                escapeshellarg($fullPath)
            );

            exec($command, $output, $returnVar);

            if ($returnVar !== 0) {
                throw new \Exception('Error al comprimir PDF');
            }

            // Verificar que el archivo comprimido existe y es más pequeño
            if (file_exists($outputPath)) {
                $compressedSize = filesize($outputPath);
                $originalSize = filesize($fullPath);

                // Si la compresión aumentó el tamaño, usar el original
                if ($compressedSize >= $originalSize) {
                    $outputPath = $fullPath;
                }

                // Limpiar archivos temporales
                Storage::delete($tempPath);

                return response()->download($outputPath)->deleteFileAfterSend(true);
            }

            throw new \Exception('Archivo comprimido no encontrado');

        } catch (\Exception $e) {
            // Limpiar archivos temporales en caso de error
            Storage::delete($tempPath);
            if (isset($outputPath) && file_exists($outputPath)) {
                unlink($outputPath);
            }

            return response()->json([
                'error' => 'No se pudo comprimir el archivo: ' . $e->getMessage()
            ], 500);
        }
    }
}