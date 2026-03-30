<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; margin:0; padding:0; }
        .container { max-width: 560px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #291136, #4A153D); padding: 32px; text-align: center; }
        .header img { height: 48px; }
        .bar { height: 4px; background: linear-gradient(to right, #291136, #BE0F4A, #291136); }
        .body { padding: 40px 32px; }
        .cargo-box { background: #f8f4ff; border: 2px solid #291136; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
        .cargo-num { font-size: 28px; font-weight: 900; letter-spacing: 4px; color: #291136; font-family: monospace; }
        .dato { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
        .dato-label { color: #999; }
        .dato-valor { color: #291136; font-weight: bold; }
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
            <p style="color:#291136; font-size:18px; font-weight:bold; margin-bottom:8px;">
                Respuesta Registrada Exitosamente
            </p>
            <p style="color:#555; font-size:14px; line-height:1.6;">
                Su respuesta ha sido recibida y registrada en el sistema.
            </p>

            <div class="cargo-box">
                <p style="color:#666; font-size:12px; margin:0 0 6px; text-transform:uppercase; letter-spacing:1px;">Numero de Cargo</p>
                <div class="cargo-num">{{ $cargo->numero_cargo }}</div>
                <p style="color:#999; font-size:12px; margin:8px 0 0;">Guarde este numero como constancia de su envio</p>
            </div>

            <div style="margin: 24px 0;">
                <div class="dato">
                    <span class="dato-label">Expediente</span>
                    <span class="dato-valor">{{ $movimiento->expediente?->numero_expediente ?? '—' }}</span>
                </div>
                <div class="dato">
                    <span class="dato-label">Instruccion respondida</span>
                    <span class="dato-valor" style="max-width:280px; text-align:right;">{{ Str::limit($movimiento->instruccion, 80) }}</span>
                </div>
                <div class="dato" style="border:none;">
                    <span class="dato-label">Fecha de respuesta</span>
                    <span class="dato-valor">{{ now()->format('d/m/Y H:i') }}</span>
                </div>
            </div>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} The Ankawa Global Group SAC — Todos los derechos reservados
        </div>
    </div>
</body>
</html>
