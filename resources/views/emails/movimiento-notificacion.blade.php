@extends('emails.layout')

@php
    // Documentos que el destinatario debe presentar (filas del pivot con tipo_documento_id).
    // El Mailable ya pre-filtró por actor_id; acá solo descartamos filas sin tipo asignado.
    $docsAPresentar = $movimiento->responsables
        ->filter(fn($r) => !empty($r->tipo_documento_id) && $r->tipoDocumento)
        ->values();
    $tieneDocsAPresentar = $docsAPresentar->count() > 0;
@endphp

@section('fields')
    @if(!empty($numeroCedula))
    <tr>
        <td class="field-label" style="padding-right: 16px;">Cédula de Notificación</td>
        <td class="field-value" style="font-family: monospace; font-weight: bold; font-size: 13px; color: #222222;">{{ $numeroCedula }}</td>
    </tr>
    @endif

    @if($movimiento->expediente)
    <tr>
        <td class="field-label">Expediente</td>
        <td class="field-value">{{ $movimiento->expediente->numero_expediente ?? 'S/N' }}</td>
    </tr>
    @endif

    @if($movimiento->etapa)
    <tr>
        <td class="field-label">Etapa</td>
        <td class="field-value">{{ $movimiento->etapa->nombre }}{{ $movimiento->subEtapa ? ' — ' . $movimiento->subEtapa->nombre : '' }}</td>
    </tr>
    @endif

    <tr>
        <td class="field-label">Sumilla</td>
        <td class="field-value">{{ $movimiento->instruccion }}</td>
    </tr>

    @if($movimiento->observaciones)
    <tr>
        <td class="field-label">Observaciones</td>
        <td class="field-value">{{ $movimiento->observaciones }}</td>
    </tr>
    @endif

    {{-- Campos legacy: SOLO se muestran para movimientos viejos sin filas en el pivot (un solo tipo de doc y una sola fecha).
         Para los nuevos movimientos con varios tipos de documento, cada uno trae su propia fecha en la sección de abajo. --}}
    @if(!$tieneDocsAPresentar)
        @if($movimiento->tipoDocumentoRequerido)
        <tr>
            <td class="field-label">Doc. Requerido</td>
            <td class="field-value">{{ $movimiento->tipoDocumentoRequerido->nombre }}</td>
        </tr>
        @endif

        @if($movimiento->fecha_limite)
        <tr>
            <td class="field-label">Fecha Límite</td>
            <td class="field-value" style="font-weight: bold; color: #BE0F4A;">
                {{ \Carbon\Carbon::parse($movimiento->fecha_limite)->format('d/m/Y') }}
            </td>
        </tr>
        @endif
    @endif

    <tr>
        <td class="field-label">Fecha y Hora</td>
        <td class="field-value">{{ now()->format('d/m/Y H:i') }}</td>
    </tr>

    <tr>
        <td class="field-label">Destinatario</td>
        <td class="field-value">{{ $nombreDestinatario }}</td>
    </tr>
@endsection

@section('extra')
    @php
        $docsRequerimiento = $movimiento->documentos
            ->where('momento', 'creacion')
            ->where('activo', true)
            ->values();
    @endphp

    {{-- ── Sección: documentos que el destinatario debe presentar ─────────────── --}}
    @if($tieneDocsAPresentar)
        <div style="margin-top: 20px; padding: 14px 14px 8px; border: 2px solid #BE0F4A; border-radius: 6px; background: #fff5f8;">
            <p style="font-size: 12px; font-weight: bold; color: #BE0F4A; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                Documentos que debe presentar ({{ $docsAPresentar->count() }})
            </p>
            <p style="font-size: 11px; color: #555555; margin-bottom: 12px;">
                Cada documento tiene su propio plazo de presentación. Ingresa a Mesa de Partes para adjuntarlos.
            </p>
            @foreach($docsAPresentar as $resp)
                @php
                    $fechaLim = $resp->fecha_limite ? \Carbon\Carbon::parse($resp->fecha_limite) : null;
                    $tipoDiasLabel = $resp->tipo_dias === 'habiles' ? 'días hábiles' : 'días calendario';
                @endphp
                <div style="margin-bottom: 8px; padding: 10px 12px; background: #ffffff; border: 1px solid #f0c8d4; border-radius: 4px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="vertical-align: top; padding-right: 10px; width: 22px;">
                                <span style="font-size: 16px;">&#128221;</span>
                            </td>
                            <td style="vertical-align: top;">
                                <p style="font-size: 13px; font-weight: bold; color: #291136; margin: 0 0 4px;">
                                    {{ $resp->tipoDocumento->nombre }}
                                </p>
                                <p style="font-size: 11.5px; color: #555555; margin: 0;">
                                    <strong style="color: #555555;">Plazo:</strong>
                                    {{ $resp->dias_plazo }} {{ $tipoDiasLabel }}
                                    @if($fechaLim)
                                        &nbsp;·&nbsp;
                                        <strong style="color: #BE0F4A;">Vence el {{ $fechaLim->format('d/m/Y') }}</strong>
                                    @endif
                                </p>
                            </td>
                        </tr>
                    </table>
                </div>
            @endforeach
        </div>
    @endif

    @if($docsRequerimiento->count() > 0)
        <div style="margin-top: 20px; padding-top: 14px; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 11.5px; font-weight: bold; color: #291136; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 10px;">
                Documentos adjuntos al requerimiento ({{ $docsRequerimiento->count() }})
            </p>
            <p style="font-size: 11px; color: #888888; margin-bottom: 10px;">
                Archivos enviados por el remitente como referencia.
            </p>
            @foreach($docsRequerimiento as $doc)
                <div style="margin-bottom: 8px; padding: 10px 12px; border: 1px solid #e0e0e0; border-radius: 4px; background: #fafafa;">
                    <a href="{{ route('mesa-partes.documentos.descargar', $doc->id) }}"
                       target="_blank"
                       style="color: #BE0F4A; text-decoration: none; font-size: 13px; font-weight: bold;">
                        &#128206; {{ $doc->nombre_original }}
                    </a>
                    <span style="display: block; font-size: 11px; color: #888888; margin-top: 2px;">
                        Click para abrirlo. Si no tiene sesión, ingrese con su correo (Mesa de Partes) y se abrirá automáticamente.
                    </span>
                </div>
            @endforeach
        </div>
    @endif

    <div style="margin-top: 20px; padding: 14px 0; border-top: 1px solid #e0e0e0; font-size: 12px; color: #555555; line-height: 1.6;">
        @if($esPortal)
            Ingrese al <strong>Portal de Mesa de Partes</strong> con su correo electrónico para revisar los detalles
            y adjuntar documentos si corresponde. Recibirá un código de verificación temporal al ingresar.
        @else
            Ingrese a la plataforma <strong>ANKAWA</strong> para revisar los detalles del expediente.
        @endif
    </div>
@endsection
