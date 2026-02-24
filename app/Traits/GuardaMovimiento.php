<?php

namespace App\Traits;

use App\Models\Documento;
use App\Models\ExpedienteArbMovimiento;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;

trait GuardaMovimiento
{
    protected function guardarMovimiento(
        string        $tipo,
        string        $descripcion,
        UploadedFile  $archivo,
        ?int          $solicitudId  = null,
        ?int          $expedienteId = null,
        ?int          $etapaId      = null,
        ?int          $actividadId  = null,
    ): ExpedienteArbMovimiento {

        // Determinar carpeta
        $carpeta = $solicitudId
            ? 'solicitudes/' . $solicitudId . '/movimientos'
            : 'expedientes/' . $expedienteId . '/movimientos';

        $ruta = $archivo->store($carpeta, 'public');

        $movimiento = ExpedienteArbMovimiento::create([
            'solicitud_id'  => $solicitudId,
            'expediente_id' => $expedienteId,
            'etapa_id'      => $etapaId,
            'actividad_id'  => $actividadId,
            'tipo'          => $tipo,
            'accion'        => $tipo,
            'descripcion'   => $descripcion,
            'usuario_id'    => Auth::id(),
            'activo'        => true,
        ]);

        Documento::create([
            'modelo_tipo'     => ExpedienteArbMovimiento::class,
            'modelo_id'       => $movimiento->id,
            'tipo_documento'  => $tipo,
            'ruta_archivo'    => $ruta,
            'nombre_original' => $archivo->getClientOriginalName(),
            'peso_bytes'      => $archivo->getSize(),
            'activo'          => true,
        ]);

        return $movimiento;
    }
}