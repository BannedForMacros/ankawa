<?php

namespace App\Http\Controllers;

use App\Models\ValidacionDocumento;
use App\Support\DecolectaClient;
use Illuminate\Http\Request;

class ConsultaDocumentoController extends Controller
{
    public function consultar(Request $request)
    {
        $tipo   = $request->query('tipo');   // 'dni' | 'ruc'
        $numero = trim($request->query('numero', ''));
        $contexto = (string) $request->query('contexto', 'form_lookup');

        if (!in_array($tipo, ['dni', 'ruc'], true) || $numero === '') {
            return response()->json(['error' => 'Parámetros inválidos'], 422);
        }

        // Formato correcto antes de tocar la API externa (de pago) o insertar
        // en validacion_documentos: DNI = 8 dígitos, RUC = 11 dígitos.
        $formatoValido = $tipo === 'dni'
            ? preg_match('/^\d{8}$/', $numero)
            : preg_match('/^\d{11}$/', $numero);

        if (!$formatoValido) {
            return response()->json(['error' => 'Parámetros inválidos'], 422);
        }

        $consulta = $tipo === 'dni'
            ? DecolectaClient::consultarDni($numero)
            : DecolectaClient::consultarRuc($numero);

        $resultado = match ($consulta['estado']) {
            'ok'             => 'valido',
            'no_encontrado'  => 'no_encontrado',
            default          => 'invalido',
        };

        // Persistir snapshot de la consulta para historial/auditoría
        ValidacionDocumento::create([
            'tipo'               => $tipo,
            'numero'             => $numero,
            'digito_verificador' => null,
            'resultado'          => $resultado,
            'respuesta_completa' => $consulta['data'],
            'ip'                 => $request->ip(),
            'user_agent'         => $request->userAgent(),
            'contexto'           => in_array($contexto, ['form_demandante', 'form_demandado', 'form_representante', 'form_arbitro', 'form_lookup'], true)
                ? $contexto
                : 'form_lookup',
            'email_sesion'       => session('portal_email'),
        ]);

        if ($consulta['estado'] === 'no_configurado') {
            return response()->json(['error' => 'Servicio no configurado'], 503);
        }

        if ($consulta['estado'] === 'no_encontrado') {
            return response()->json(['no_encontrado' => true], 404);
        }

        if ($consulta['estado'] === 'error') {
            return response()->json(['error' => $consulta['mensaje'] ?? 'Error en servicio externo'], 502);
        }

        $data = $consulta['data'] ?? [];

        if ($tipo === 'dni') {
            return response()->json([
                'nombre'    => $this->formatearNombreReniec($data),
                'documento' => $data['document_number'] ?? null,
            ]);
        }

        $partes = array_filter([
            $data['via_tipo'] ?? null,
            $data['via_nombre'] ?? null,
            isset($data['numero']) && $data['numero'] !== '' ? 'NRO. ' . $data['numero'] : null,
            isset($data['interior']) && $data['interior'] !== '' && $data['interior'] !== '-' ? 'INT. ' . $data['interior'] : null,
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

    private function formatearNombreReniec(array $data): ?string
    {
        $nombres   = trim((string) ($data['first_name'] ?? ''));
        $paterno   = trim((string) ($data['first_last_name'] ?? ''));
        $materno   = trim((string) ($data['second_last_name'] ?? ''));
        $apellidos = trim($paterno . ' ' . $materno);

        if ($apellidos !== '' && $nombres !== '') {
            return mb_strtoupper($apellidos . ', ' . $nombres);
        }

        $fullName = $data['full_name'] ?? null;
        return $fullName ? mb_strtoupper($fullName) : null;
    }
}
