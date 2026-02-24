<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Solicitud Admitida</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                    <tr>
                        <td style="background:#291136;padding:32px 40px;text-align:center;">
                            <h1 style="color:#ffffff;margin:0;font-size:22px;">Ankawa Internacional</h1>
                            <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:13px;">Centro de Arbitraje y Resolución de Disputas</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#F0FDF4;border-bottom:3px solid #16A34A;padding:20px 40px;">
                            <p style="margin:0;color:#15803D;font-size:15px;font-weight:bold;">✓ Su solicitud ha sido admitida</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:36px 40px;">
                            <p style="color:#374151;font-size:15px;margin:0 0 16px;">
                                Estimado/a <strong>{{ $solicitud->nombre_demandante }}</strong>,
                            </p>
                            <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 24px;">
                                Su solicitud ha sido admitida a trámite. Se ha generado el expediente:
                            </p>
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                                <tr>
                                    <td style="background:#F0FDF4;border-radius:8px;padding:20px;text-align:center;">
                                        <p style="margin:0 0 4px;color:#6B7280;font-size:12px;text-transform:uppercase;">N° de Expediente</p>
                                        <p style="margin:0;color:#291136;font-size:24px;font-weight:bold;font-family:monospace;">{{ $numeroExpediente }}</p>
                                    </td>
                                </tr>
                            </table>
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ url('/mesa-partes/mis-solicitudes') }}"
                                           style="display:inline-block;background:#BE0F4A;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:15px;">
                                            Ver mi expediente
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
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