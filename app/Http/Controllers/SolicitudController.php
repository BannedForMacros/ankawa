<?php

namespace App\Http\Controllers;

use App\Mail\CargoSolicitudMail;
use App\Mail\CodigoVerificacionMail;
use App\Models\Correlativo;
use App\Models\Rol;
use App\Models\Servicio;
use App\Models\SolicitudArbitraje;
use App\Models\User;
use App\Models\VerificationCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;

class SolicitudController extends Controller
{
    // ── Selección de servicio ──
    public function index()
    {
        $servicios = Servicio::where('activo', 1)
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'descripcion']);

        return Inertia::render('Solicitud/Index', [
            'servicios' => $servicios,
        ]);
    }

    // ── Formulario del servicio ──
    public function formulario(Servicio $servicio)
    {
        return Inertia::render('Solicitud/Formulario', [
            'servicio' => $servicio,
        ]);
    }

    // ── Enviar OTP al email del demandante ──
    public function enviarCodigo(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'nombre'   => 'required|string',
            'servicio' => 'required|string',
        ]);

        // Invalidar códigos anteriores del mismo email
        VerificationCode::where('email', $request->email)
            ->where('usado', false)
            ->update(['usado' => true]);

        $codigo = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        VerificationCode::create([
            'email'      => $request->email,
            'codigo'     => $codigo,
            'expires_at' => now()->addMinutes(15),
            'usado'      => false,
        ]);

        Mail::to($request->email)->send(
            new CodigoVerificacionMail($request->nombre, $codigo, $request->servicio)
        );

        return response()->json(['ok' => true]);
    }

    // ── Verificar OTP ──
    public function verificarCodigo(Request $request)
    {
        $request->validate([
            'email'  => 'required|email',
            'codigo' => 'required|string|size:6',
        ]);

        $registro = VerificationCode::where('email', $request->email)
            ->where('codigo', $request->codigo)
            ->where('usado', false)
            ->latest()
            ->first();

        if (!$registro || !$registro->esValido()) {
            return response()->json([
                'ok'      => false,
                'mensaje' => 'El codigo es invalido o ha expirado.',
            ], 422);
        }

        $registro->update(['usado' => true]);

        return response()->json(['ok' => true]);
    }

    // ── Guardar solicitud completa ──
    public function store(Request $request)
    {
        $request->validate([
            'servicio_id'                   => 'required|exists:servicios,id',
            'tipo_persona'                  => 'required|in:natural,juridica',
            'nombre_demandante'             => 'required|string|max:255',
            'documento_demandante'          => 'required|string|max:20',
            'nombre_representante'          => 'nullable|string|max:255',
            'documento_representante'       => 'nullable|string|max:20',
            'domicilio_demandante'          => 'required|string|max:500',
            'email_demandante'              => 'required|email|max:255',
            'telefono_demandante'           => 'required|string|max:20',
            'nombre_demandado'              => 'required|string|max:255',
            'domicilio_demandado'           => 'required|string|max:500',
            'email_demandado'               => 'nullable|email|max:255',
            'telefono_demandado'            => 'nullable|string|max:20',
            'resumen_controversia'          => 'required|string',
            'pretensiones'                  => 'required|string',
            'monto_involucrado'             => 'nullable|numeric|min:0',
            'solicita_designacion_director' => 'required|in:0,1',
            'nombre_arbitro_propuesto'      => 'nullable|string|max:255',
            'email_arbitro_propuesto'       => 'nullable|email|max:255',
            'domicilio_arbitro_propuesto'   => 'nullable|string|max:500',
            'reglas_aplicables'             => 'nullable|string|max:255',
        ]);

        DB::beginTransaction();

        try {
            // 1. Correlativo de cargo
            $anio        = now()->year;
            $correlativo = Correlativo::where('tipo', 'CARGO')
                ->where('anio', $anio)
                ->lockForUpdate()
                ->first();

            if (!$correlativo) {
                $correlativo = Correlativo::create([
                    'tipo'          => 'CARGO',
                    'anio'          => $anio,
                    'ultimo_numero' => 0,
                    'activo'        => 1,
                ]);
            }

            $correlativo->increment('ultimo_numero');
            $numeroCargo = 'CARGO-' . str_pad($correlativo->ultimo_numero, 4, '0', STR_PAD_LEFT) . '-' . $anio;

            // 2. Crear o buscar usuario cliente
            $usuario     = User::where('email', $request->email_demandante)->first();
            $passwordRaw = null;

            if (!$usuario) {
                $rolCliente  = Rol::where('nombre', 'like', '%Cliente%')->first();
                $passwordRaw = $request->documento_demandante . Str::random(6);

                $usuario = User::create([
                    'name'     => $request->nombre_demandante,
                    'email'    => $request->email_demandante,
                    'password' => Hash::make($passwordRaw),
                    'rol_id'   => $rolCliente?->id,
                    'activo'   => 1,
                ]);
            }

            // 3. Crear solicitud
            $solicitud = SolicitudArbitraje::create([
                'servicio_id'                   => $request->servicio_id,
                'numero_cargo'                  => $numeroCargo,
                'usuario_id'                    => $usuario->id,
                'tipo_persona'                  => $request->tipo_persona,
                'nombre_demandante'             => $request->nombre_demandante,
                'documento_demandante'          => $request->documento_demandante,
                'nombre_representante'          => $request->nombre_representante,
                'documento_representante'       => $request->documento_representante,
                'domicilio_demandante'          => $request->domicilio_demandante,
                'email_demandante'              => $request->email_demandante,
                'telefono_demandante'           => $request->telefono_demandante,
                'nombre_demandado'              => $request->nombre_demandado,
                'domicilio_demandado'           => $request->domicilio_demandado,
                'email_demandado'               => $request->email_demandado,
                'telefono_demandado'            => $request->telefono_demandado,
                'resumen_controversia'          => $request->resumen_controversia,
                'pretensiones'                  => $request->pretensiones,
                'monto_involucrado'             => $request->monto_involucrado,
                'solicita_designacion_director' => $request->solicita_designacion_director,
                'nombre_arbitro_propuesto'      => $request->nombre_arbitro_propuesto,
                'email_arbitro_propuesto'       => $request->email_arbitro_propuesto,
                'domicilio_arbitro_propuesto'   => $request->domicilio_arbitro_propuesto,
                'reglas_aplicables'             => $request->reglas_aplicables,
                'estado'                        => 'pendiente',
                'activo'                        => 1,
            ]);

            // 4. Generar PDF
            $pdfPath = $this->generarCargo($solicitud);

            // 5. Enviar email con cargo
            Mail::to($solicitud->email_demandante, $solicitud->nombre_demandante)
                ->send(new CargoSolicitudMail($solicitud, $passwordRaw, $pdfPath));

            DB::commit();

            // Limpiar PDF temporal después de enviar
            @unlink($pdfPath);

            return redirect()->route('solicitud.confirmacion', $solicitud->numero_cargo);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error solicitud: ' . $e->getMessage());
            return back()->withErrors(['general' => 'Ocurrio un error. Por favor intente nuevamente.']);
        }
    }

    // ── Confirmación ──
    public function confirmacion(string $numeroCargo)
    {
        return Inertia::render('Solicitud/Confirmacion', [
            'numeroCargo' => $numeroCargo,
        ]);
    }

    // ── Generar PDF cargo ──
    private function generarCargo(SolicitudArbitraje $solicitud): string
    {
        $solicitud->load('servicio');

        $pdf  = app('dompdf.wrapper');
        $html = view('pdf.cargo-solicitud', ['solicitud' => $solicitud])->render();
        $pdf->loadHTML($html);
        $pdf->setPaper('A4', 'portrait');

        $path = storage_path('app/temp/cargo_' . $solicitud->numero_cargo . '.pdf');

        if (!file_exists(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }

        file_put_contents($path, $pdf->output());
        return $path;
    }
}