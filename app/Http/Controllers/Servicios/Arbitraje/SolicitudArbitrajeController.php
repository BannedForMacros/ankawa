<?php

namespace App\Http\Controllers\Servicios\Arbitraje;

use App\Http\Controllers\Controller;
use App\Models\SolicitudArbitraje;
use App\Models\Expediente;
use App\Models\ExpedienteActor;
use App\Models\ExpedienteMovimiento;
use App\Models\TipoActorExpediente;
use App\Models\Actividad;
use App\Models\Documento;
use App\Models\User;
use App\Models\Rol;
use App\Models\Correlativo;
use App\Mail\CargoSolicitudMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class SolicitudArbitrajeController extends Controller
{
    public function store(Request $request)
    {
        // 1. Validaciones
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
            
            'documentos_anexos'             => 'required|array|min:1',
            'documentos_anexos.*'           => 'file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
        ]);

        DB::beginTransaction();

        try {
            // 2. Correlativo de Cargo Temporal
            $anio        = now()->year;
            $correlativo = Correlativo::where('tipo', 'CARGO')->where('anio', $anio)->lockForUpdate()->first();

            if (!$correlativo) {
                $correlativo = Correlativo::create(['tipo' => 'CARGO', 'anio' => $anio, 'ultimo_numero' => 0, 'activo' => 1]);
            }

            $correlativo->increment('ultimo_numero');
            $numeroCargo = 'CARGO-' . str_pad($correlativo->ultimo_numero, 4, '0', STR_PAD_LEFT) . '-' . $anio;

            // 3. Crear usuario Demandante (si no está logueado)
            $userId = \Illuminate\Support\Facades\Auth::id();
            $passwordRaw = null;

            if (!$userId) {
                $userExists = User::where('email', $request->email_demandante)->orWhere('numero_documento', $request->documento_demandante)->exists();
                if ($userExists) {
                    return back()->withErrors(['general' => 'El correo o documento ya pertenece a un usuario registrado. Por favor, inicie sesión.']);
                }

                $passwordRaw = $request->documento_demandante . Str::random(6);
                $usuarioNuevo = User::create([
                    'name'             => $request->nombre_demandante,
                    'email'            => $request->email_demandante,
                    'password'         => Hash::make($passwordRaw),
                    'rol_id'           => Rol::ROL_CLIENTE, // <-- USO DE LA CONSTANTE
                    'tipo_persona'     => $request->tipo_persona,
                    'numero_documento' => $request->documento_demandante,
                    'telefono'         => $request->telefono_demandante,
                    'direccion'        => $request->domicilio_demandante,
                    'activo'           => 1,
                ]);
                $userId = $usuarioNuevo->id;
            }

            // 4. Crear la Solicitud Inicial
            $solicitud = SolicitudArbitraje::create(array_merge(
                $request->except('documentos_anexos'),
                [
                    'numero_cargo' => $numeroCargo,
                    'usuario_id'   => $userId,
                    'estado'       => 'pendiente',
                    'activo'       => 1,
                ]
            ));

            // 5. EL NACIMIENTO DEL EXPEDIENTE EN EL MOTOR DE FLUJO
            // Buscamos la Actividad 1 y 2 según tu imagen
            $actividad1 = Actividad::whereHas('etapa', fn($q) => $q->where('servicio_id', $request->servicio_id)->where('orden', 1))
                                   ->orderBy('orden')->firstOrFail();
                                   
            $actividad2 = Actividad::whereHas('etapa', fn($q) => $q->where('servicio_id', $request->servicio_id)->where('orden', 1))
                                   ->where('orden', '>', $actividad1->orden)->orderBy('orden')->firstOrFail();

            // Nace el expediente SIN NÚMERO FORMAL (La secretaria lo pondrá después)
            $expediente = Expediente::create([
                'solicitud_id'        => $solicitud->id,
                'servicio_id'         => $request->servicio_id,
                'numero_expediente'   => null, 
                'etapa_actual_id'     => $actividad2->etapa_id, // Lo mandamos a la Bandeja de la Secretaria (Act 2)
                'actividad_actual_id' => $actividad2->id,
                'estado'              => 'en_proceso'
            ]);

            // Asignar Actores (Demandante y Demandado)
            $tipoActorDemandante = TipoActorExpediente::where('slug', 'demandante')->first();
            $tipoActorDemandado  = TipoActorExpediente::where('slug', 'demandado')->first();

            if ($tipoActorDemandante) {
                ExpedienteActor::create(['expediente_id' => $expediente->id, 'usuario_id' => $userId, 'tipo_actor_id' => $tipoActorDemandante->id]);
            }

            // Crear al Demandado inmediatamente usando la constante
            $userDemandado = User::where('email', $request->email_demandado)->first();
            if (!$userDemandado && $request->email_demandado) {
                $userDemandado = User::create([
                    'name'      => $request->nombre_demandado,
                    'email'     => $request->email_demandado,
                    'password'  => Hash::make(Str::random(10)),
                    'rol_id'    => Rol::ROL_CLIENTE, // <-- USO DE LA CONSTANTE
                    'direccion' => $request->domicilio_demandado,
                    'telefono'  => $request->telefono_demandado,
                    'activo'    => 1
                ]);
            }

            if ($tipoActorDemandado && $userDemandado) {
                ExpedienteActor::create(['expediente_id' => $expediente->id, 'usuario_id' => $userDemandado->id, 'tipo_actor_id' => $tipoActorDemandado->id]);
            }

            // Registrar movimiento: De Actividad 1 a Actividad 2
            ExpedienteMovimiento::create([
                'expediente_id'        => $expediente->id,
                'actividad_origen_id'  => $actividad1->id,
                'actividad_destino_id' => $actividad2->id,
                'usuario_id'           => $userId,
                'observaciones'        => 'Presentación de Solicitud de Arbitraje vía Portal Web.',
                'fecha_movimiento'     => now()
            ]);

            // 6. Guardar Documentos Adjuntos
            if ($request->hasFile('documentos_anexos')) {
                foreach ($request->file('documentos_anexos') as $archivo) {
                    $ruta = $archivo->store('solicitudes/' . $solicitud->id . '/anexos', 'public');
                    Documento::create([
                        'modelo_tipo'     => SolicitudArbitraje::class,
                        'modelo_id'       => $solicitud->id,
                        'tipo_documento'  => 'anexo_inicial',
                        'ruta_archivo'    => $ruta,
                        'nombre_original' => $archivo->getClientOriginalName(),
                        'peso_bytes'      => $archivo->getSize(),
                        'activo'          => 1,
                    ]);
                }
            }

            // 7. Generar PDF Cargo y Enviar Correo
            $pdfPath = $this->generarCargo($solicitud);
            Mail::to($solicitud->email_demandante, $solicitud->nombre_demandante)
                ->send(new CargoSolicitudMail($solicitud, $passwordRaw, $pdfPath));

            DB::commit();
            @unlink($pdfPath);

            return redirect()->route('mesa-partes.confirmacion', $solicitud->numero_cargo);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error solicitud arbitraje: ' . $e->getMessage());
            return back()->withErrors(['general' => 'Ocurrió un error. Por favor intente nuevamente.']);
        }
    }

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