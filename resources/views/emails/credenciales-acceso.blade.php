@extends('emails.layout')

@section('fields')
    <tr>
        <td class="field-label">Destinatario</td>
        <td class="field-value">{{ $nombreDestinatario }}</td>
    </tr>

    @if($numeroExpediente)
    <tr>
        <td class="field-label">Expediente</td>
        <td class="field-value">{{ $numeroExpediente }}</td>
    </tr>
    @endif

    @if($numeroCargo)
    <tr>
        <td class="field-label">N° Cargo</td>
        <td class="field-value">{{ $numeroCargo }}</td>
    </tr>
    @endif

    <tr>
        <td class="field-label">Usuario</td>
        <td class="field-value">{{ $emailUsuario }}</td>
    </tr>

    <tr>
        <td class="field-label">Contraseña temporal</td>
        <td class="field-value" style="font-weight: bold; color: #BE0F4A; font-family: monospace;">
            {{ $passwordTemporal }}
        </td>
    </tr>

    <tr style="border-bottom: none;">
        <td class="field-label">Fecha y Hora</td>
        <td class="field-value">{{ now()->format('d/m/Y H:i') }}</td>
    </tr>
@endsection

@section('extra')
    <div style="margin-top: 20px; padding: 14px 16px; border-top: 1px solid #e0e0e0; background: #FFF7ED; border-left: 4px solid #BE0F4A; font-size: 13px; color: #1a1a1a; line-height: 1.6;">
        <strong>Importante:</strong> Por su seguridad, ingrese a la plataforma
        <strong>{{ config('app.sufijo_centro', 'CARD ANKAWA') }}</strong> y cambie su contraseña en el primer acceso.
        @if($contexto === 'expediente')
            Una vez dentro, podrá consultar el Expediente Electrónico en el que ha sido designado.
        @endif
    </div>
@endsection
