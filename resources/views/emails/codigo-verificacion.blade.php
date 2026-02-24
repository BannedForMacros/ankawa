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
        .codigo-box { background: #f8f4ff; border: 2px solid #291136; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
        .codigo { font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #291136; font-family: monospace; }
        .expira { font-size: 13px; color: #BE0F4A; font-weight: bold; margin-top: 8px; }
        .aviso { background: #fff8f0; border-left: 4px solid #BE0F4A; padding: 16px; border-radius: 8px; font-size: 13px; color: #666; margin-top: 24px; }
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
                Hola, {{ $nombre }}
            </p>
            <p style="color:#555; font-size:15px; line-height:1.6;">
                Ha iniciado el proceso de presentacion de una solicitud de arbitraje para el servicio
                <strong style="color:#291136;">{{ $servicio }}</strong>.
            </p>
            <p style="color:#555; font-size:14px;">
                Ingrese el siguiente codigo para verificar su identidad y continuar con el formulario:
            </p>

            <div class="codigo-box">
                <div class="codigo">{{ $codigo }}</div>
                <div class="expira">Valido por 15 minutos</div>
            </div>

            <p style="color:#555; font-size:14px; line-height:1.6;">
                Si usted no ha iniciado este proceso, ignore este correo. Nadie mas tiene acceso a este codigo.
            </p>

            <div class="aviso">
                <strong>Importante:</strong> Al ingresar este codigo, usted confirma que esta actuando
                en pleno uso de sus facultades y que la informacion proporcionada es veridica conforme
                a la Ley N° 29733 — Ley de Proteccion de Datos Personales del Peru.
            </div>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} The Ankawa Global Group SAC — Todos los derechos reservados
        </div>
    </div>
</body>
</html>