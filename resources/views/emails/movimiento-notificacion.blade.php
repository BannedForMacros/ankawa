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
        .alert { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 12px; margin: 12px 0; }
        .cedula { background: #f3e8ff; border: 1px solid #c084fc; border-radius: 6px; padding: 10px 14px; margin: 14px 0; font-size: 13px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            @include('emails.partials.logo')
        </div>
        <div class="bar"></div>
        <div class="body">
            <p>Estimado(a) <strong>{{ $nombreDestinatario }}</strong>,</p>

            @if($movimiento->tipo === 'requerimiento')
                <p>Se le ha generado un <strong>requerimiento</strong> que requiere su atención:</p>
            @else
                <p>Se le informa del siguiente traslado en el expediente:</p>
            @endif

            @if(!empty($numeroCedula))
            <div class="cedula">
                <span style="color:#7c3aed;font-weight:bold;">Cédula de Notificación:</span>
                <span style="font-family:monospace;font-weight:bold;font-size:14px;">{{ $numeroCedula }}</span>
            </div>
            @endif

            @if($movimiento->etapa)
            <div class="info-row">
                <span class="label">Etapa:</span>
                {{ $movimiento->etapa->nombre }}{{ $movimiento->subEtapa ? ' — ' . $movimiento->subEtapa->nombre : '' }}
            </div>
            @endif

            @if($movimiento->expediente)
            <div class="info-row">
                <span class="label">Expediente:</span>
                {{ $movimiento->expediente->numero_expediente ?? 'S/N' }}
            </div>
            @endif

            <div class="info-row">
                <span class="label">{{ $movimiento->tipo === 'requerimiento' ? 'Instrucción' : 'Descripción' }}:</span>
                {{ $movimiento->instruccion }}
            </div>

            @if($movimiento->observaciones)
            <div class="info-row">
                <span class="label">Observaciones:</span>
                {{ $movimiento->observaciones }}
            </div>
            @endif

            @if($movimiento->tipo === 'requerimiento' && $movimiento->tipoDocumentoRequerido)
            <div class="alert">
                <strong>📄 Documento requerido:</strong> {{ $movimiento->tipoDocumentoRequerido->nombre }}
            </div>
            @endif

            @if($movimiento->fecha_limite)
            <div class="info-row">
                <span class="label">⏰ Fecha límite:</span>
                <strong>{{ \Carbon\Carbon::parse($movimiento->fecha_limite)->format('d/m/Y') }}</strong>
            </div>
            @endif

            <p style="margin-top:20px;">
                @if($esPortal)
                    Ingrese al <strong>Portal de Mesa de Partes</strong> con su correo electrónico para revisar los detalles y adjuntar documentos si corresponde. Recibirá un código de verificación temporal al ingresar.
                @else
                    Ingrese a la plataforma <strong>ANKAWA</strong> para revisar los detalles.
                @endif
            </p>
        </div>
        <div class="footer">
            <p>Este es un mensaje automático. No responda a este correo.</p>
            <p>Centro de Arbitraje CARD ANKAWA</p>
        </div>
    </div>
</body>
</html>
