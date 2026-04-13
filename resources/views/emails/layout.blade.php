<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #ffffff; color: #1a1a1a; }
        .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #cccccc; }
        .header { background: #ffffff; padding: 28px 40px 20px; text-align: center; }
        .inst-name { margin-top: 14px; text-align: center; line-height: 1.4; }
        .inst-name p { font-size: 12px; font-weight: bold; letter-spacing: 0.5px; color: #1a1a1a; text-transform: uppercase; }
        .inst-sub { font-size: 13px; font-weight: 900; letter-spacing: 1px; color: #1a1a1a; text-transform: uppercase; }
        .qr-area { margin-top: 14px; text-align: center; }
        .qr-area svg { width: 80px; height: 80px; }
        .separator-black { height: 3px; background: #000000; }
        .separator-red { height: 2px; background: #BE0F4A; }
        .body { padding: 24px 40px 28px; }
        .fields-table { width: 100%; border-collapse: collapse; }
        .fields-table td { padding: 8px 0; border-bottom: 1px solid #e0e0e0; font-size: 13px; vertical-align: top; }
        .field-label { font-weight: bold; text-transform: uppercase; font-size: 11.5px; letter-spacing: 0.4px; color: #1a1a1a; width: 160px; padding-right: 16px; white-space: nowrap; }
        .field-value { color: #222222; }
        .closing { padding: 20px 40px; text-align: center; border-top: 1px solid #e0e0e0; }
        .closing p { font-size: 12px; color: #555555; }
        .closing .gracias { font-size: 14px; font-weight: bold; color: #1a1a1a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
        .social-bar { padding: 14px 40px; text-align: center; border-top: 1px solid #e0e0e0; }
        .social-bar a { color: #BE0F4A; text-decoration: none; font-size: 12px; font-weight: bold; margin: 0 10px; }
        .social-bar a:hover { text-decoration: underline; }
        .social-sep { color: #cccccc; }
        .footer { background: #f7f7f7; border-top: 1px solid #e0e0e0; padding: 14px 40px; text-align: center; }
        .footer-brand { font-size: 13px; font-weight: 900; color: #BE0F4A; text-transform: uppercase; letter-spacing: 1px; }
        .footer-address { font-size: 11px; color: #888888; margin-top: 4px; }
    </style>
</head>
<body>
<div class="wrapper">

    {{-- HEADER --}}
    <div class="header">
        @include('emails.partials.logo')
        <div class="inst-name">
            <p>Centro de Arbitraje y Resolución de Disputas</p>
            <p class="inst-sub">Ankawa Internacional</p>
            <p>Mesa de Partes</p>
        </div>
        <div class="qr-area">
            {!! QrCode::size(80)->generate(config('app.url')) !!}
        </div>
    </div>

    <div class="separator-black"></div>
    <div class="separator-red"></div>

    {{-- BODY --}}
    <div class="body">
        @hasSection('otp_block')
            @yield('otp_block')
        @endif

        <table class="fields-table">
            @yield('fields')
        </table>

        @hasSection('extra')
            @yield('extra')
        @endif
    </div>

    {{-- CIERRE --}}
    <div class="closing">
        <p class="gracias">Muchas Gracias</p>
        <p>Mensaje automático, por favor no responder a este correo.</p>
    </div>

    {{-- ENLACES --}}
    <div class="social-bar">
        <a href="{{ config('app.url') }}/servicios">&#127760; Servicios</a>
        <span class="social-sep">|</span>
        <a href="{{ config('app.url') }}">&#128279; Web</a>
        <span class="social-sep">|</span>
        <a href="mailto:contacto@ankawainternacional.com">&#9993; Contacto</a>
    </div>

    {{-- FOOTER --}}
    <div class="footer">
        <div class="footer-brand">CARD-ANKAWA INTL</div>
        <div class="footer-address">
            Centro de Arbitraje y Resolución de Disputas &mdash; Lima, Per&uacute;<br>
            &copy; {{ date('Y') }} The Ankawa Global Group SAC &mdash; Todos los derechos reservados
        </div>
    </div>

</div>
</body>
</html>
