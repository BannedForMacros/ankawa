<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ConsultaDocumentoController extends Controller
{
    public function consultar(Request $request)
    {
        $tipo   = $request->query('tipo');   // 'dni' | 'ruc'
        $numero = trim($request->query('numero', ''));

        if (!in_array($tipo, ['dni', 'ruc']) || !$numero) {
            return response()->json(['error' => 'Parámetros inválidos'], 422);
        }

        $token = config('services.decolecta.token');
        if (!$token) {
            return response()->json(['error' => 'Servicio no configurado'], 503);
        }

        try {
            if ($tipo === 'dni') {
                $resp = Http::withToken($token)
                    ->timeout(8)
                    ->get('https://api.decolecta.com/v1/reniec/dni', ['numero' => $numero]);
            } else {
                $resp = Http::withToken($token)
                    ->timeout(8)
                    ->get('https://api.decolecta.com/v1/sunat/ruc', ['numero' => $numero]);
            }

            if ($resp->successful()) {
                $data = $resp->json();

                if ($tipo === 'dni') {
                    return response()->json([
                        'nombre'    => $data['full_name'] ?? null,
                        'documento' => $data['document_number'] ?? null,
                    ]);
                } else {
                    // Construir dirección desde campos SUNAT
                    $partes = array_filter([
                        $data['via_tipo'] ?? null,
                        $data['via_nombre'] ?? null,
                        $data['numero'] ? 'NRO. ' . $data['numero'] : null,
                        $data['interior'] && $data['interior'] !== '-' ? 'INT. ' . $data['interior'] : null,
                        $data['zona_codigo'] ?? null,
                        $data['zona_tipo'] ?? null,
                        $data['distrito'] ?? null,
                        $data['provincia'] ?? null,
                        $data['departamento'] ?? null,
                    ]);

                    return response()->json([
                        'nombre'    => $data['razon_social'] ?? null,
                        'documento' => $data['numero_documento'] ?? null,
                        'domicilio' => implode(' ', $partes) ?: ($data['direccion'] ?? null),
                        'estado'    => $data['estado'] ?? null,
                        'condicion' => $data['condicion'] ?? null,
                    ]);
                }
            }

            if ($resp->status() === 404 || $resp->status() === 422) {
                return response()->json(['no_encontrado' => true], 404);
            }

            return response()->json(['error' => 'Error en servicio externo'], 502);

        } catch (\Exception $e) {
            \Log::warning("Decolecta API error: " . $e->getMessage());
            return response()->json(['error' => 'No disponible'], 503);
        }
    }
}
