<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 560px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #291136, #4A153D); padding: 32px; text-align: center; }
        .header img { height: 48px; }
        .bar { height: 4px; background: linear-gradient(to right, #291136, #BE0F4A, #291136); }
        .body { padding: 40px 32px; }
        .ref-box { background: #f8f4ff; border: 2px solid #291136; border-radius: 12px; padding: 16px 20px; margin: 20px 0; }
        .ref-num { font-size: 22px; font-weight: 900; letter-spacing: 3px; color: #291136; font-family: monospace; }
        .accion-badge { display: inline-block; background: #BE0F4A; color: white; border-radius: 8px; padding: 6px 16px; font-weight: bold; font-size: 14px; margin: 12px 0; }
        .actividad-box { background: #fff7ed; border-left: 4px solid #f97316; border-radius: 0 8px 8px 0; padding: 12px 16px; margin: 16px 0; }
        .actividad-label { font-size: 11px; color: #9a3412; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
        .actividad-nombre { font-size: 16px; font-weight: bold; color: #7c2d12; }
        .dato { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
        .dato-label { color: #999; }
        .dato-valor { color: #291136; font-weight: bold; text-align: right; max-width: 300px; }
        .observacion { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin: 16px 0; font-size: 14px; color: #374151; line-height: 1.6; font-style: italic; }
        .btn { display: block; width: fit-content; margin: 28px auto 0; background: #BE0F4A; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 15px; }
        .footer { background: #291136; padding: 20px; text-align: center; color: rgba(255,255,255,0.5); font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="{{ asset('logo-white.png') }}" alt="Ankawa Internacional" />
        </div>
        <div class="bar"></div>
        <div class="body">

            <p style="color:#291136; font-size:18px; font-weight:bold; margin-bottom:4px;">
                Notificación de Expediente
            </p>
            <p style="color:#555; font-size:14px; line-height:1.6; margin-top:0;">
                Estimado/a <strong>{{ $nombreDestinatario }}</strong>, le informamos que se ha registrado
                una acción en el siguiente expediente del cual usted es parte.
            </p>

            {{-- Referencia --}}
            <div class="ref-box">
                <p style="color:#666; font-size:11px; margin:0 0 4px; text-transform:uppercase; letter-spacing:1px;">Expediente</p>
                <div class="ref-num">{{ $expediente->numero_expediente ?? $expediente->solicitud?->numero_cargo ?? 'EXP-' . $expediente->id }}</div>
            </div>

            {{-- Acción ejecutada --}}
            <p style="font-size:13px; color:#555; margin-bottom:4px;">Acción ejecutada:</p>
            <div class="accion-badge">{{ $transicion->etiqueta_boton }}</div>

            {{-- Nueva actividad --}}
            <div class="actividad-box">
                <div class="actividad-label">El caso avanza a</div>
                <div class="actividad-nombre">{{ $actividadDestino->nombre }}</div>
            </div>

            {{-- Datos del caso --}}
            <div style="margin: 20px 0;">
                <div class="dato">
                    <span class="dato-label">Ejecutado por</span>
                    <span class="dato-valor">{{ $movimiento->usuario?->name ?? 'Sistema' }}</span>
                </div>
                <div class="dato">
                    <span class="dato-label">Fecha</span>
                    <span class="dato-valor">{{ \Carbon\Carbon::parse($movimiento->fecha_movimiento)->format('d/m/Y H:i') }}</span>
                </div>
                @if($expediente->solicitud)
                <div class="dato">
                    <span class="dato-label">Demandante</span>
                    <span class="dato-valor">{{ $expediente->solicitud->nombre_demandante }}</span>
                </div>
                <div class="dato">
                    <span class="dato-label">Demandado</span>
                    <span class="dato-valor">{{ $expediente->solicitud->nombre_demandado }}</span>
                </div>
                @endif
            </div>

            {{-- Observaciones --}}
            @if($movimiento->observaciones)
            <p style="font-size:13px; color:#555; margin-bottom:4px; font-weight:bold;">Observaciones / Motivo:</p>
            <div class="observacion">{{ $movimiento->observaciones }}</div>
            @endif

            <a href="{{ url('/expedientes/' . $expediente->id) }}" class="btn">
                Ver Expediente en el Sistema
            </a>

        </div>
        <div class="footer">
            <p style="margin:0 0 4px;">Centro de Arbitraje Ankawa Internacional</p>
            <p style="margin:0; font-size:10px;">Este correo es una notificación automática. No responda a este mensaje.</p>
        </div>
    </div>
</body>
</html>
