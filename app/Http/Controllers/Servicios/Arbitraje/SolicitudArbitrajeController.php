<?php

namespace App\Http\Controllers\Servicios\Arbitraje;

use App\Http\Controllers\Controller;
use App\Models\SolicitudArbitraje;
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
    // ── Guardar solicitud completa (Paso 6 del formulario) ──
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
            
            // LOS NUEVOS ANEXOS
            'documentos_anexos'             => 'required|array|min:1',
            'documentos_anexos.*'           => 'file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
        ]);

        DB::beginTransaction();

        try {
            // 2. Lógica del Correlativo (Idéntica a la que ya tenías)
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

            // 3. Crear o buscar usuario cliente
            $userId = \Illuminate\Support\Facades\Auth::id(); // Sacamos el ID si está logueado
            $passwordRaw = null;

            if (!$userId) {
                // Si NO está logueado, verificamos que no intente crear un duplicado
                $userExists = User::where('email', $request->email_demandante)
                    ->orWhere('numero_documento', $request->documento_demandante)
                    ->exists();

                if ($userExists) {
                    return back()->withErrors(['general' => 'El correo o documento ingresado ya pertenece a un usuario registrado. Por favor, inicie sesión.']);
                }

                // Si todo está limpio, le creamos la cuenta
                $rolCliente  = Rol::where('nombre', 'like', '%Cliente%')->first();
                $passwordRaw = $request->documento_demandante . Str::random(6);

                $usuarioNuevo = User::create([
                    'name'             => $request->nombre_demandante,
                    'email'            => $request->email_demandante,
                    'password'         => \Illuminate\Support\Facades\Hash::make($passwordRaw),
                    'rol_id'           => $rolCliente?->id,
                    'tipo_persona'     => $request->tipo_persona,
                    'numero_documento' => $request->documento_demandante,
                    'telefono'         => $request->telefono_demandante,
                    'direccion'        => $request->domicilio_demandante,
                    'activo'           => 1,
                ]);
                
                $userId = $usuarioNuevo->id; // Si era nuevo, ahora $userId ya tiene valor
            }

            // 4. Crear la solicitud
            $solicitud = SolicitudArbitraje::create(array_merge(
                $request->except('documentos_anexos'), // Quitamos los archivos del request general
                [
                    'numero_cargo' => $numeroCargo,
                    'usuario_id'   => $userId,     // <--- ¡AQUÍ ESTABA EL ERROR! AHORA USA $userId
                    'estado'       => 'pendiente',
                    'activo'       => 1,
                ]
            ));

            // 5. Guardar los documentos adjuntos
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

            // 5. Guardar los documentos adjuntos
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

            // 6. Generar PDF Cargo
            $pdfPath = $this->generarCargo($solicitud);

            // 7. Enviar email con cargo
            Mail::to($solicitud->email_demandante, $solicitud->nombre_demandante)
                ->send(new CargoSolicitudMail($solicitud, $passwordRaw, $pdfPath));

            DB::commit();

            @unlink($pdfPath); // Limpiar PDF temporal

            // 8. Redirigir a la vista de éxito genérica
            return redirect()->route('mesa-partes.confirmacion', $solicitud->numero_cargo);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error solicitud arbitraje: ' . $e->getMessage());
            return back()->withErrors(['general' => 'Ocurrio un error. Por favor intente nuevamente.']);
        }
    }

    // ── Generar PDF cargo (Igual a tu código) ──
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