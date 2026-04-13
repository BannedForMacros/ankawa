@extends('emails.layout')

@section('fields')
    @if(!empty($numeroCedula))
    <tr>
        <td class="field-label" style="padding-right: 16px;">Número de Registro</td>
        <td class="field-value" style="font-family: monospace; font-weight: bold; font-size: 13px; color: #222222;">{{ $numeroCedula }}</td>
    </tr>
    @endif

    @if($movimiento->expediente)
    <tr>
        <td class="field-label">Expediente</td>
        <td class="field-value">{{ $movimiento->expediente->numero_expediente ?? 'S/N' }}</td>
    </tr>
    @endif

    @if($movimiento->etapa)
    <tr>
        <td class="field-label">Etapa</td>
        <td class="field-value">{{ $movimiento->etapa->nombre }}{{ $movimiento->subEtapa ? ' — ' . $movimiento->subEtapa->nombre : '' }}</td>
    </tr>
    @endif

    <tr>
        <td class="field-label">Sumilla</td>
        <td class="field-value">{{ $movimiento->instruccion }}</td>
    </tr>

    @if($movimiento->observaciones)
    <tr>
        <td class="field-label">Observaciones</td>
        <td class="field-value">{{ $movimiento->observaciones }}</td>
    </tr>
    @endif

    @if($movimiento->tipoDocumentoRequerido)
    <tr>
        <td class="field-label">Doc. Requerido</td>
        <td class="field-value">{{ $movimiento->tipoDocumentoRequerido->nombre }}</td>
    </tr>
    @endif

    <tr>
        <td class="field-label">Folios</td>
        <td class="field-value">{{ $movimiento->documentos->count() ?: '—' }}</td>
    </tr>

    @if($movimiento->fecha_limite)
    <tr>
        <td class="field-label">Fecha Límite</td>
        <td class="field-value" style="font-weight: bold; color: #BE0F4A;">
            {{ \Carbon\Carbon::parse($movimiento->fecha_limite)->format('d/m/Y') }}
        </td>
    </tr>
    @endif

    <tr>
        <td class="field-label">Fecha y Hora</td>
        <td class="field-value">{{ now()->format('d/m/Y H:i') }}</td>
    </tr>

    <tr>
        <td class="field-label">Destinatario</td>
        <td class="field-value">{{ $nombreDestinatario }}</td>
    </tr>
@endsection

@section('extra')
    <div style="margin-top: 20px; padding: 14px 0; border-top: 1px solid #e0e0e0; font-size: 12px; color: #555555; line-height: 1.6;">
        @if($esPortal)
            Ingrese al <strong>Portal de Mesa de Partes</strong> con su correo electrónico para revisar los detalles
            y adjuntar documentos si corresponde. Recibirá un código de verificación temporal al ingresar.
        @else
            Ingrese a la plataforma <strong>ANKAWA</strong> para revisar los detalles del expediente.
        @endif
    </div>
@endsection
