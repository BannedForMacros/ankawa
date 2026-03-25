<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1a365d; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .body { background: #f7fafc; padding: 20px; border: 1px solid #e2e8f0; }
        .footer { padding: 15px; text-align: center; font-size: 12px; color: #718096; }
        .info-row { padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .label { font-weight: bold; color: #2d3748; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Notificación de Movimiento</h2>
        </div>
        <div class="body">
            <p>Estimado(a) <strong>{{ $nombreDestinatario }}</strong>,</p>

            <p>Se ha registrado un nuevo movimiento en el expediente:</p>

            <div class="info-row">
                <span class="label">Expediente:</span>
                {{ $movimiento->expediente->numero_expediente ?? 'S/N' }}
            </div>

            <div class="info-row">
                <span class="label">Instrucción:</span>
                {{ $movimiento->instruccion }}
            </div>

            @if($movimiento->observaciones)
            <div class="info-row">
                <span class="label">Observaciones:</span>
                {{ $movimiento->observaciones }}
            </div>
            @endif

            @if($movimiento->fecha_limite)
            <div class="info-row">
                <span class="label">Fecha límite:</span>
                {{ $movimiento->fecha_limite->format('d/m/Y') }}
            </div>
            @endif

            <p style="margin-top: 20px;">
                Ingrese a la plataforma para revisar los detalles del movimiento.
            </p>
        </div>
        <div class="footer">
            <p>Este es un mensaje automático. No responda a este correo.</p>
        </div>
    </div>
</body>
</html>
