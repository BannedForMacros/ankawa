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
        .credenciales { background: #f0fff4; border: 1px solid #86efac; border-radius: 12px; padding: 20px; margin-top: 24px; }
        .btn { display: block; width: fit-content; margin: 24px auto 0; background: #BE0F4A; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 15px; }
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
                Solicitud Registrada Exitosamente
            </p>
            <p style="color:#555; font-size:14px; line-height:1.6;">
                Estimado/a <strong>{{ $solicitud->nombre_demandante }}</strong>, su solicitud de arbitraje
                ha sido recibida y registrada en nuestro sistema.
            </p>

            <div class="cargo-box">
                <p style="color:#666; font-size:12px; margin:0 0 6px; text-transform:uppercase; letter-spacing:1px;">Numero de Cargo</p>
                <div class="cargo-num">{{ $solicitud->numero_cargo }}</div>
                <p style="color:#999; font-size:12px; margin:8px 0 0;">Guarde este numero para hacer seguimiento</p>
            </div>

            <div style="margin: 24px 0;">
                <div class="dato">
                    <span class="dato-label">Servicio</span>
                    <span class="dato-valor">{{ $solicitud->servicio->nombre }}</span>
                </div>
                <div class="dato">
                    <span class="dato-label">Demandante</span>
                    <span class="dato-valor">{{ $solicitud->nombre_demandante }}</span>
                </div>
                <div class="dato">
                    <span class="dato-label">Demandado</span>
                    <span class="dato-valor">{{ $solicitud->nombre_demandado }}</span>
                </div>
                <div class="dato">
                    <span class="dato-label">Fecha de presentacion</span>
                    <span class="dato-valor">{{ $solicitud->created_at->format('d/m/Y H:i') }}</span>
                </div>
                <div class="dato" style="border:none;">
                    <span class="dato-label">Estado</span>
                    <span style="color:#BE0F4A; font-weight:bold;">Pendiente de revision</span>
                </div>
            </div>

            @if($passwordRaw)
            <div class="credenciales">
                <p style="color:#166534; font-weight:bold; margin:0 0 12px; font-size:15px;">
                    Sus credenciales de acceso al sistema
                </p>
                <div class="dato" style="border-color:#bbf7d0;">
                    <span class="dato-label">Correo</span>
                    <span class="dato-valor">{{ $solicitud->email_demandante }}</span>
                </div>
                <div class="dato" style="border:none;">
                    <span class="dato-label">Contrasena temporal</span>
                    <span class="dato-valor" style="font-family:monospace; font-size:16px; letter-spacing:2px;">{{ $passwordRaw }}</span>
                </div>
                <p style="color:#166534; font-size:12px; margin:12px 0 0;">
                    Le recomendamos cambiar su contrasena al ingresar por primera vez.
                </p>
            </div>
            @else
            <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:16px; margin-top:16px;">
                <p style="color:#1e40af; font-size:14px; margin:0;">
                    Ya tiene una cuenta registrada. Use sus credenciales actuales para ingresar.
                </p>
            </div>
            @endif

            <p style="color:#555; font-size:13px; margin-top:20px;">
                Adjuntamos a este correo el <strong>cargo de presentacion en PDF</strong> como constancia oficial de su solicitud.
            </p>

            <a href="{{ route('login') }}" class="btn">Ingresar al Sistema</a>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} The Ankawa Global Group SAC — Todos los derechos reservados
        </div>
    </div>
</body>
</html>