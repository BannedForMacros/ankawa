<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Notificación de Demanda Arbitral</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0"
                    style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

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
                        <td style="background:#FEF2F2;border-bottom:3px solid #BE0F4A;padding:20px 40px;">
                            <p style="margin:0;color:#BE0F4A;font-size:15px;font-weight:bold;">
                                📋 Ha sido notificado en un proceso arbitral
                            </p>
                        </td>
                    </tr>

                    <!-- Cuerpo -->
                    <tr>
                        <td style="padding:36px 40px;">
                            <p style="color:#374151;font-size:15px;margin:0 0 16px;">
                                Estimado/a <strong>{{ $solicitud->nombre_demandado }}</strong>,
                            </p>
                            <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 20px;">
                                Por medio de la presente, el Centro de Arbitraje y Resolución de Disputas
                                <strong>Ankawa Internacional</strong> le notifica que
                                <strong>{{ $solicitud->nombre_demandante }}</strong> ha iniciado
                                un proceso arbitral en su contra, el cual ha sido admitido a trámite.
                            </p>

                            <!-- Datos del expediente -->
                            <table width="100%" cellpadding="0" cellspacing="0"
                                style="background:#F8FAFC;border-radius:8px;padding:20px;margin-bottom:24px;">
                                <tr>
                                    <td style="padding:6px 0;">
                                        <span style="color:#6B7280;font-size:12px;text-transform:uppercase;">
                                            N° Expediente
                                        </span><br>
                                        <strong style="color:#291136;font-size:16px;font-family:monospace;">
                                            {{ $numeroExpediente }}
                                        </strong>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:6px 0;border-top:1px solid #E5E7EB;">
                                        <span style="color:#6B7280;font-size:12px;text-transform:uppercase;">
                                            Demandante
                                        </span><br>
                                        <strong style="color:#374151;font-size:14px;">
                                            {{ $solicitud->nombre_demandante }}
                                        </strong>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:6px 0;border-top:1px solid #E5E7EB;">
                                        <span style="color:#6B7280;font-size:12px;text-transform:uppercase;">
                                            Materia
                                        </span><br>
                                        <span style="color:#374151;font-size:14px;">
                                            {{ $solicitud->resumen_controversia }}
                                        </span>
                                    </td>
                                </tr>
                            </table>

                            <!-- Plazo apersonamiento -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                                <tr>
                                    <td style="background:#EFF6FF;border-left:4px solid #3B82F6;
                                        border-radius:0 8px 8px 0;padding:16px 20px;">
                                        <p style="margin:0;color:#1E40AF;font-size:14px;line-height:1.6;">
                                            ⏱ Tiene <strong>5 días hábiles</strong> para apersonarse
                                            al proceso desde la recepción de este comunicado,
                                            conforme al reglamento del Centro.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 24px;">
                                Para apersonarse y presentar su respuesta, puede ingresar al
                                sistema o comunicarse directamente con el Centro.
                            </p>

                            <!-- CTA -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ url('/mesa-partes') }}"
                                            style="display:inline-block;background:#291136;color:#ffffff;
                                            text-decoration:none;padding:14px 32px;border-radius:8px;
                                            font-weight:bold;font-size:15px;">
                                            Ingresar al sistema
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color:#6B7280;font-size:13px;line-height:1.6;margin:0;">
                                Si tiene consultas, comuníquese con el Centro de Arbitraje
                                Ankawa Internacional a través de nuestros canales oficiales.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background:#F9FAFB;border-top:1px solid #E5E7EB;
                            padding:24px 40px;text-align:center;">
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