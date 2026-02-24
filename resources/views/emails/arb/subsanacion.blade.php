<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solicitud requiere subsanación</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background:#291136;padding:32px 40px;text-align:center;">
                            <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:bold;">
                                Ankawa Internacional
                            </h1>
                            <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:13px;">
                                Centro de Arbitraje y Resolución de Disputas
                            </p>
                        </td>
                    </tr>

                    <!-- Alerta -->
                    <tr>
                        <td style="background:#FFF7ED;border-bottom:3px solid #F97316;padding:20px 40px;">
                            <p style="margin:0;color:#C2410C;font-size:15px;font-weight:bold;">
                                ⚠ Su solicitud requiere corrección
                            </p>
                        </td>
                    </tr>

                    <!-- Cuerpo -->
                    <tr>
                        <td style="padding:36px 40px;">
                            <p style="color:#374151;font-size:15px;margin:0 0 16px;">
                                Estimado/a <strong>{{ $solicitud->nombre_demandante }}</strong>,
                            </p>
                            <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 24px;">
                                La Secretaría General Adjunta ha revisado su solicitud 
                                <strong>{{ $solicitud->numero_cargo }}</strong> y ha encontrado 
                                observaciones que deben ser subsanadas antes de continuar con el proceso.
                            </p>

                            <!-- Observación -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                                <tr>
                                    <td style="background:#FFF7ED;border-left:4px solid #F97316;border-radius:0 8px 8px 0;padding:16px 20px;">
                                        <p style="margin:0 0 8px;color:#92400E;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;">
                                            Observación
                                        </p>
                                        <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">
                                            {{ $observacion }}
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Plazo -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                                <tr>
                                    <td style="background:#EFF6FF;border-radius:8px;padding:16px 20px;">
                                        <p style="margin:0;color:#1E40AF;font-size:14px;">
                                            🗓 Tiene <strong>{{ $plazo_dias }} días hábiles</strong> para 
                                            subsanar, hasta el <strong>{{ $fechaLimite }}</strong>.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- CTA -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ url('/mesa-partes/mis-solicitudes') }}"
                                           style="display:inline-block;background:#BE0F4A;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:15px;">
                                            Ingresar y subsanar
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color:#6B7280;font-size:13px;line-height:1.6;margin:0;">
                                Si no subsana en el plazo indicado, su solicitud podrá ser archivada 
                                conforme al reglamento del Centro.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:24px 40px;text-align:center;">
                            <p style="margin:0;color:#9CA3AF;font-size:12px;">
                                Centro de Arbitraje y Resolución de Disputas Ankawa Internacional<br>
                                Este es un correo automático, por favor no responda a este mensaje.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>