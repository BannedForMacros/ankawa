<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #291136, #4A153D); padding: 32px; text-align: center; }
        .header img { height: 48px; }
        .bar { height: 4px; background: linear-gradient(to right, #291136, #BE0F4A, #291136); }
        .body { background: #f7fafc; padding: 20px; border: 1px solid #e2e8f0; }
        .footer { padding: 15px; text-align: center; font-size: 12px; color: #718096; }
        .info-row { padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .label { font-weight: bold; color: #2d3748; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            @include('emails.partials.logo')
        </div>
        <div class="bar"></div>
        <div class="body">
            <p>Estimado(a) <strong>{{ $actor->usuario?->name ?? $actor->nombre_externo ?? 'Participante' }}</strong>,</p>

            <p>Se le ha habilitado el acceso al portal de <strong>Mesa de Partes</strong> para el siguiente expediente:</p>

            <div class="info-row">
                <span class="label">Expediente:</span>
                {{ $expediente->numero_expediente ?? 'S/N' }}
            </div>

            @if($expediente->servicio)
            <div class="info-row">
                <span class="label">Servicio:</span>
                {{ $expediente->servicio->nombre }}
            </div>
            @endif

            <div class="info-row">
                <span class="label">Tipo de actor:</span>
                {{ $actor->tipoActor?->nombre ?? '—' }}
            </div>

            <p style="margin-top: 16px;">
                A través del <strong>Portal de Mesa de Partes</strong> podrá visualizar este expediente, responder requerimientos y enviar documentos.
            </p>

            <p>
                Para ingresar, acceda al portal con su correo electrónico (<strong>{{ $actor->usuario?->email ?? $actor->email_externo }}</strong>). Recibirá un código de verificación temporal en cada sesión — no necesita contraseña.
            </p>
        </div>
        <div class="footer">
            Centro de Arbitraje CARD ANKAWA — {{ date('Y') }}<br>
            Este es un mensaje automático, por favor no responda a este correo.
        </div>
    </div>
</body>
</html>
