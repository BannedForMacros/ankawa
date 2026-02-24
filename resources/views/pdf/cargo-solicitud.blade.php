<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #222; }
        .header { background: #291136; color: white; padding: 20px 30px; display: flex; align-items: center; justify-content: space-between; }
        .header-title { font-size: 16px; font-weight: bold; }
        .header-sub { font-size: 11px; opacity: 0.7; margin-top: 4px; }
        .bar { height: 4px; background: linear-gradient(to right, #291136, #BE0F4A, #291136); }
        .content { padding: 24px 30px; }
        .cargo-header { text-align: center; border: 2px solid #291136; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
        .cargo-titulo { font-size: 14px; font-weight: bold; color: #291136; text-transform: uppercase; letter-spacing: 1px; }
        .cargo-numero { font-size: 26px; font-weight: 900; color: #BE0F4A; letter-spacing: 4px; margin: 6px 0; }
        .cargo-fecha { font-size: 11px; color: #666; }
        .seccion { margin-bottom: 20px; }
        .seccion-titulo { background: #291136; color: white; padding: 6px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 4px; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 5px 8px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
        td:first-child { color: #666; width: 40%; font-size: 10px; text-transform: uppercase; }
        td:last-child { font-weight: bold; color: #291136; }
        .estado { display: inline-block; background: #fef3c7; color: #92400e; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: bold; }
        .firma { margin-top: 40px; text-align: center; }
        .firma-linea { border-top: 1px solid #291136; width: 220px; margin: 0 auto; padding-top: 8px; font-size: 11px; color: #291136; }
        .footer-pdf { margin-top: 30px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
        .declaracion { background: #f8f4ff; border: 1px solid #d8b4fe; border-radius: 6px; padding: 12px; font-size: 10px; color: #555; line-height: 1.6; margin-top: 16px; }
    </style>
</head>
<body>

    <div class="header">
        <div>
            <div class="header-title">Centro de Arbitraje Ankawa Internacional</div>
            <div class="header-sub">The Ankawa Global Group SAC — Registrado ante INDECOPI</div>
        </div>
        <div style="text-align:right;">
            <div style="font-size:10px; opacity:0.7;">Cargo de Presentacion</div>
            <div style="font-size:13px; font-weight:bold; letter-spacing:1px;">{{ $solicitud->numero_cargo }}</div>
        </div>
    </div>
    <div class="bar"></div>

    <div class="content">

        <div class="cargo-header">
            <div class="cargo-titulo">Cargo de Presentacion de Solicitud</div>
            <div class="cargo-numero">{{ $solicitud->numero_cargo }}</div>
            <div class="cargo-fecha">
                Presentado el {{ $solicitud->created_at->format('d \d\e F \d\e Y') }} a las {{ $solicitud->created_at->format('H:i') }} horas
            </div>
        </div>

        <!-- Servicio -->
        <div class="seccion">
            <div class="seccion-titulo">Servicio Solicitado</div>
            <table>
                <tr>
                    <td>Tipo de servicio</td>
                    <td>{{ $solicitud->servicio->nombre }}</td>
                </tr>
                <tr>
                    <td>Estado</td>
                    <td><span class="estado">Pendiente de revision</span></td>
                </tr>
            </table>
        </div>

        <!-- Demandante -->
        <div class="seccion">
            <div class="seccion-titulo">Datos del Demandante</div>
            <table>
                <tr><td>Tipo</td><td>{{ ucfirst($solicitud->tipo_persona) }}</td></tr>
                <tr><td>Nombre / Razon Social</td><td>{{ $solicitud->nombre_demandante }}</td></tr>
                <tr><td>Documento</td><td>{{ $solicitud->documento_demandante }}</td></tr>
                @if($solicitud->nombre_representante)
                <tr><td>Representante Legal</td><td>{{ $solicitud->nombre_representante }}</td></tr>
                <tr><td>DNI Representante</td><td>{{ $solicitud->documento_representante }}</td></tr>
                @endif
                <tr><td>Domicilio</td><td>{{ $solicitud->domicilio_demandante }}</td></tr>
                <tr><td>Correo electronico</td><td>{{ $solicitud->email_demandante }}</td></tr>
                <tr><td>Telefono</td><td>{{ $solicitud->telefono_demandante }}</td></tr>
            </table>
        </div>

        <!-- Demandado -->
        <div class="seccion">
            <div class="seccion-titulo">Datos del Demandado</div>
            <table>
                <tr><td>Nombre / Razon Social</td><td>{{ $solicitud->nombre_demandado }}</td></tr>
                <tr><td>Domicilio</td><td>{{ $solicitud->domicilio_demandado }}</td></tr>
                @if($solicitud->email_demandado)
                <tr><td>Correo electronico</td><td>{{ $solicitud->email_demandado }}</td></tr>
                @endif
            </table>
        </div>

        <!-- Controversia -->
        <div class="seccion">
            <div class="seccion-titulo">Materia de Controversia</div>
            <table>
                <tr><td>Resumen</td><td>{{ $solicitud->resumen_controversia }}</td></tr>
                <tr><td>Pretensiones</td><td>{{ $solicitud->pretensiones }}</td></tr>
                @if($solicitud->monto_involucrado)
                <tr><td>Monto (S/)</td><td>{{ number_format($solicitud->monto_involucrado, 2) }}</td></tr>
                @endif
            </table>
        </div>

        <div class="declaracion">
            El presentante declara que la informacion consignada en este documento es veridica y exacta,
            asumiendo plena responsabilidad por su contenido conforme a la Ley de Arbitraje (D.L. 1071),
            la Ley N° 29733 de Proteccion de Datos Personales y el Reglamento del Centro de Arbitraje
            Ankawa Internacional.
        </div>

        <div class="firma">
            <div class="firma-linea">
                Centro de Arbitraje Ankawa Internacional<br>
                <span style="font-size:10px; color:#999;">Sello y firma digital del sistema</span>
            </div>
        </div>

        <div class="footer-pdf">
            Documento generado automaticamente por el sistema el {{ now()->format('d/m/Y H:i:s') }} —
            Ankawa Internacional © {{ date('Y') }}
        </div>

    </div>
</body>
</html>