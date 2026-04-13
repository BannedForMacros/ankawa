@extends('emails.layout')

@section('fields')
    <tr>
        <td class="field-label">Expediente</td>
        <td class="field-value">{{ $expediente->numero_expediente ?? 'S/N' }}</td>
    </tr>

    @if($expediente->servicio)
    <tr>
        <td class="field-label">Servicio</td>
        <td class="field-value">{{ $expediente->servicio->nombre }}</td>
    </tr>
    @endif

    <tr>
        <td class="field-label">Sumilla</td>
        <td class="field-value">{{ $actor->tipoActor?->nombre ?? '—' }}</td>
    </tr>
    <tr style="border-bottom: none;">
        <td class="field-label">Fecha y Hora</td>
        <td class="field-value">{{ now()->format('d/m/Y H:i') }}</td>
    </tr>
@endsection

@section('extra')
    <div style="margin-top: 20px; font-size: 12px; color: #444444; line-height: 1.7; padding-top: 16px; border-top: 1px solid #e0e0e0;">
        <p>
            Se le ha habilitado el acceso al <strong>Portal de Mesa de Partes</strong>.
            A través del portal podrá visualizar este expediente, responder requerimientos y enviar documentos.
        </p>
        <p style="margin-top: 10px;">
            Para ingresar, acceda al portal con su correo electrónico
            (<strong>{{ $actor->usuario?->email ?? $actor->email_externo }}</strong>).
            Recibirá un código de verificación temporal en cada sesión — no necesita contraseña.
        </p>
    </div>
@endsection
