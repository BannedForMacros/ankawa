<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Solicitud No Admitida</title></head>
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
                        <td style="background:#FEF2F2;border-bottom:3px solid #DC2626;padding:20px 40px;">
                            <p style="margin:0;color:#B91C1C;font-size:15px;font-weight:bold;">✗ Su solicitud no ha sido admitida</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:36px 40px;">
                            <p style="color:#374151;font-size:15px;margin:0 0 16px;">
                                Estimado/a <strong>{{ $solicitud->nombre_demandante }}</strong>,
                            </p>
                            <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 24px;">
                                Luego de la revisión de su solicitud <strong>{{ $solicitud->numero_cargo }}</strong>, 
                                la Secretaría General Adjunta ha resuelto no admitirla a trámite por el siguiente motivo:
                            </p>
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                                <tr>
                                    <td style="background:#FEF2F2;border-left:4px solid #DC2626;border-radius:0 8px 8px 0;padding:16px 20px;">
                                        <p style="margin:0 0 8px;color:#991B1B;font-size:12px;font-weight:bold;text-transform:uppercase;">Motivo</p>
                                        <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">{{ $motivo }}</p>
                                    </td>
                                </tr>
                            </table>
                            <p style="color:#6B7280;font-size:13px;line-height:1.6;margin:0;">
                                Si considera que esta decisión es incorrecta, puede presentar una nueva solicitud 
                                subsanando los motivos indicados o contactar directamente al Centro.
                            </p>
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