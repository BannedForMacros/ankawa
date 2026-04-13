@extends('emails.layout')

@section('otp_block')
    <div style="text-align: center; margin-bottom: 24px; padding: 24px; background: #f8f4ff; border: 2px solid #291136;">
        <p style="font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; font-weight: bold;">
            Código de Verificación
        </p>
        <div style="font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #291136; font-family: monospace;">
            {{ $codigo }}
        </div>
        <p style="font-size: 12px; color: #BE0F4A; font-weight: bold; margin-top: 8px;">
            Válido por 15 minutos
        </p>
    </div>
@endsection

@section('fields')
    <tr>
        <td class="field-label">Servicio</td>
        <td class="field-value">{{ $servicio }}</td>
    </tr>
    <tr style="border-bottom: none;">
        <td class="field-label">Fecha y Hora</td>
        <td class="field-value">{{ now()->format('d/m/Y H:i') }}</td>
    </tr>
@endsection

@section('extra')
    <div style="margin-top: 20px; font-size: 12px; color: #555555; line-height: 1.6;">
        <p>Si usted no ha iniciado este proceso, ignore este correo. Nadie más tiene acceso a este código.</p>
    </div>
    <div style="margin-top: 14px; border-left: 3px solid #BE0F4A; padding: 12px 14px; background: #fff8f0; font-size: 11.5px; color: #666666; line-height: 1.6;">
        <strong>Importante:</strong> Al ingresar este código, usted confirma que está actuando en pleno uso de sus
        facultades y que la información proporcionada es verídica conforme a la
        <strong>Ley N° 29733 — Ley de Protección de Datos Personales del Perú</strong>.
    </div>
@endsection
