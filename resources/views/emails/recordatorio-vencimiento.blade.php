@extends('emails.layout')

@section('fields')
    @if($movimiento->expediente)
    <tr>
        <td class="field-label">Expediente</td>
        <td class="field-value">{{ $movimiento->expediente->numero_expediente ?? 'S/N' }}</td>
    </tr>
    @endif

    @if($movimiento->etapa)
    <tr>
        <td class="field-label">Etapa</td>
        <td class="field-value">{{ $movimiento->etapa->nombre }}</td>
    </tr>
    @endif

    <tr>
        <td class="field-label">Requerimiento</td>
        <td class="field-value">{{ $movimiento->instruccion }}</td>
    </tr>

    @php $fechaParaMostrar = $fechaLimite ?? $movimiento->fecha_limite; @endphp
    @if($fechaParaMostrar)
    <tr>
        <td class="field-label">Fecha Límite</td>
        <td class="field-value" style="font-weight: bold; color: #BE0F4A;">
            {{ \Carbon\Carbon::parse($fechaParaMostrar)->format('d/m/Y') }}
        </td>
    </tr>
    @endif

    <tr>
        <td class="field-label">Días Restantes</td>
        <td class="field-value">
            <span style="display: inline-block; background: #FEF3C7; color: #92400E; font-weight: bold; font-size: 13px; padding: 3px 10px; border-radius: 4px; border: 1px solid #FCD34D;">
                1 día — Vence mañana
            </span>
        </td>
    </tr>

    <tr>
        <td class="field-label">Destinatario</td>
        <td class="field-value">{{ $nombreDestinatario }}</td>
    </tr>
@endsection

@section('extra')
    <div style="margin-top: 20px; padding: 14px 16px; border-top: 1px solid #e0e0e0; background: #FFF7ED; border-left: 4px solid #BE0F4A; font-size: 13px; color: #1a1a1a; line-height: 1.6;">
        <strong>Recordatorio:</strong> Su plazo para responder este requerimiento vence mañana.
        Ingrese a la plataforma <strong>ANKAWA</strong> y registre su respuesta antes de que el plazo expire.
    </div>
@endsection
