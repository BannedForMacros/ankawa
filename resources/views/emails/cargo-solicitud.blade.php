@extends('emails.layout')

@section('fields')
    <tr>
        <td class="field-label" style="padding-right: 16px;">Número de Registro</td>
        <td class="field-value" style="font-family: monospace; font-weight: bold; font-size: 13px; color: #222222;">{{ $solicitud->numero_cargo }}</td>
    </tr>
    <tr>
        <td class="field-label">Expediente</td>
        <td class="field-value">{{ $expediente?->numero_expediente ?? 'Pendiente de asignación' }}</td>
    </tr>
    <tr>
        <td class="field-label">Sumilla</td>
        <td class="field-value">{{ $solicitud->servicio->nombre }}</td>
    </tr>
    <tr>
        <td class="field-label">Fecha y Hora</td>
        <td class="field-value">{{ $solicitud->created_at->format('d/m/Y H:i') }}</td>
    </tr>
    <tr>
        <td class="field-label">Solicitante</td>
        <td class="field-value">{{ $solicitud->nombre_demandante }}</td>
    </tr>
    <tr>
        <td class="field-label">Parte demandada</td>
        <td class="field-value">{{ $solicitud->nombre_demandado }}</td>
    </tr>
    <tr style="border-bottom: none;">
        <td class="field-label">Estado</td>
        <td class="field-value" style="color: #BE0F4A; font-weight: bold;">Pendiente de revisión</td>
    </tr>
@endsection

@section('extra')
    @if($passwordRaw)
    <div style="margin-top: 20px; border: 1px solid #86efac; background: #f0fff4; padding: 16px;">
        <p style="font-size: 12px; font-weight: bold; color: #166534; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
            Credenciales de acceso al sistema
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <tr>
                <td style="padding: 5px 0; border-bottom: 1px solid #bbf7d0; color: #555555; width: 130px;">Correo electrónico</td>
                <td style="padding: 5px 0; border-bottom: 1px solid #bbf7d0; color: #1a1a1a; font-weight: bold;">{{ $solicitud->email_demandante }}</td>
            </tr>
            <tr>
                <td style="padding: 5px 0; color: #555555;">Contraseña temporal</td>
                <td style="padding: 5px 0; color: #1a1a1a; font-family: monospace; font-weight: bold; font-size: 14px; letter-spacing: 2px;">{{ $passwordRaw }}</td>
            </tr>
        </table>
        <p style="font-size: 11px; color: #166534; margin-top: 10px;">Le recomendamos cambiar su contraseña al ingresar por primera vez.</p>
    </div>
    @else
    <div style="margin-top: 20px; border: 1px solid #bfdbfe; background: #eff6ff; padding: 14px; font-size: 12px; color: #1e40af; line-height: 1.5;">
        Ya tiene una cuenta registrada. Use sus credenciales actuales para ingresar al sistema.
    </div>
    @endif

    <div style="margin-top: 14px; font-size: 12px; color: #555555; line-height: 1.6;">
        Se adjunta a este correo el <strong>cargo de presentación en PDF</strong> como constancia oficial de su solicitud.
    </div>

    <div style="margin-top: 18px; text-align: center;">
        <a href="{{ route('login') }}"
           style="display: inline-block; background: #BE0F4A; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
            Ingresar al Sistema
        </a>
    </div>
@endsection
