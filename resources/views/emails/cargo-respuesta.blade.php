@extends('emails.layout')

@php
    $entregados = $docsEntregados ?? [];
    $pendientes = $docsPendientes ?? [];
    // Cada entregado puede traer 'archivos' (formato nuevo, con detalle) o 'count' (formato legacy).
    $totalArchivos = collect($entregados)->sum(fn($d) => count($d['archivos'] ?? []) ?: ($d['count'] ?? 0));
    $completado = !empty($entregados) && empty($pendientes);

    $formatBytes = function ($b) {
        if (!$b) return '';
        if ($b < 1024) return $b.' B';
        if ($b < 1024*1024) return round($b/1024).' KB';
        return number_format($b/1024/1024, 1).' MB';
    };
@endphp

@section('fields')
    <tr>
        <td class="field-label" style="padding-right: 16px;">Número de Cargo</td>
        <td class="field-value" style="font-family: monospace; font-weight: bold; font-size: 13px; color: #222222;">{{ $cargo->numero_cargo }}</td>
    </tr>
    <tr>
        <td class="field-label">Expediente</td>
        <td class="field-value">{{ $movimiento->expediente?->numero_expediente ?? '—' }}</td>
    </tr>
    <tr>
        <td class="field-label">Sumilla</td>
        <td class="field-value">{{ \Str::limit($movimiento->instruccion, 140) }}</td>
    </tr>
    <tr style="border-bottom: none;">
        <td class="field-label">Fecha y Hora</td>
        <td class="field-value">{{ now()->format('d/m/Y H:i') }}</td>
    </tr>
@endsection

@section('extra')
    {{-- ── Bloque: documentos efectivamente entregados en este cargo ──────────── --}}
    @if(!empty($entregados))
        <div style="margin-top: 20px; padding: 14px; border: 2px solid #10b981; border-radius: 6px; background: #ecfdf5;">
            <p style="font-size: 12px; font-weight: bold; color: #047857; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                &#10003; Documentos recibidos ({{ count($entregados) }})
            </p>
            <p style="font-size: 11px; color: #065f46; margin-bottom: 10px;">
                Hemos registrado tu entrega bajo este número de cargo. Total de archivos: <strong>{{ $totalArchivos }}</strong>.
            </p>
            @foreach($entregados as $doc)
                @php $archivos = $doc['archivos'] ?? []; $cant = count($archivos) ?: ($doc['count'] ?? 0); @endphp
                <div style="margin-bottom: 8px; padding: 10px 12px; background: #ffffff; border: 1px solid #a7f3d0; border-radius: 4px;">
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
                        <tr>
                            <td style="vertical-align: middle; padding-right: 10px; width: 22px;">
                                <span style="font-size: 14px; color: #10b981;">&#9989;</span>
                            </td>
                            <td style="vertical-align: middle;">
                                <p style="font-size: 13px; font-weight: bold; color: #065f46; margin: 0;">
                                    {{ $doc['nombre'] }}
                                </p>
                            </td>
                            <td style="vertical-align: middle; text-align: right; white-space: nowrap;">
                                <span style="font-size: 11px; color: #047857; font-weight: bold;">
                                    {{ $cant }} archivo{{ $cant !== 1 ? 's' : '' }}
                                </span>
                            </td>
                        </tr>
                    </table>
                    @foreach($archivos as $a)
                        <div style="padding: 6px 10px 6px 32px; font-size: 12px; border-top: 1px solid #d1fae5; line-height: 1.4;">
                            <span style="color: #10b981; margin-right: 6px;">&#128206;</span>
                            @if(!empty($a['url']))
                                <a href="{{ $a['url'] }}" target="_blank"
                                   style="color: #047857; font-family: monospace; word-break: break-all; text-decoration: underline; font-weight: bold;">{{ $a['nombre_original'] }}</a>
                            @else
                                <span style="color: #065f46; font-family: monospace; word-break: break-all;">{{ $a['nombre_original'] }}</span>
                            @endif
                            @if(!empty($a['peso_bytes']))
                                <span style="color: #6b7280; font-size: 11px; margin-left: 6px;">({{ $formatBytes($a['peso_bytes']) }})</span>
                            @endif
                            @if(!empty($a['url']))
                                <span style="display: block; padding-left: 22px; font-size: 11px; color: #6b7280; margin-top: 2px;">
                                    Click para abrirlo en una pestaña nueva
                                </span>
                            @endif
                        </div>
                    @endforeach
                </div>
            @endforeach
        </div>
    @endif

    {{-- ── Bloque: documentos que aún siguen pendientes para este destinatario ── --}}
    @if(!empty($pendientes))
        <div style="margin-top: 18px; padding: 14px; border: 2px solid #BE0F4A; border-radius: 6px; background: #fff5f8;">
            <p style="font-size: 12px; font-weight: bold; color: #BE0F4A; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                &#9888; Documentos aún pendientes ({{ count($pendientes) }})
            </p>
            <p style="font-size: 11px; color: #555555; margin-bottom: 10px;">
                Estos documentos siguen pendientes de entrega. Cada uno conserva su propio plazo.
            </p>
            @foreach($pendientes as $doc)
                <div style="margin-bottom: 6px; padding: 8px 12px; background: #ffffff; border: 1px solid #f0c8d4; border-radius: 4px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="vertical-align: middle; padding-right: 10px; width: 22px;">
                                <span style="font-size: 14px;">&#128221;</span>
                            </td>
                            <td style="vertical-align: middle;">
                                <p style="font-size: 13px; font-weight: bold; color: #291136; margin: 0;">
                                    {{ $doc['nombre'] }}
                                </p>
                                @if(!empty($doc['fecha_limite']))
                                    <p style="font-size: 11px; color: #555555; margin: 2px 0 0;">
                                        Plazo: {{ $doc['dias_plazo'] }} {{ $doc['tipo_dias'] === 'habiles' ? 'días hábiles' : 'días calendario' }}
                                        &nbsp;·&nbsp;
                                        <strong style="color: #BE0F4A;">Vence el {{ $doc['fecha_limite'] }}</strong>
                                    </p>
                                @endif
                            </td>
                        </tr>
                    </table>
                </div>
            @endforeach
        </div>
    @endif

    {{-- ── Mensaje de cierre según el caso ─────────────────────────────────────── --}}
    @if($completado)
        <div style="margin-top: 18px; padding: 12px 14px; background: #ecfdf5; border-left: 4px solid #10b981; border-radius: 4px;">
            <p style="font-size: 12px; color: #065f46; margin: 0; line-height: 1.5;">
                <strong>Has completado todos los documentos requeridos.</strong> El expediente continuará su trámite normal.
            </p>
        </div>
    @elseif(!empty($pendientes))
        <div style="margin-top: 18px; padding: 12px 14px; background: #fff5f8; border-left: 4px solid #BE0F4A; border-radius: 4px;">
            <p style="font-size: 12px; color: #555555; margin: 0; line-height: 1.5;">
                Recuerda ingresar a <strong>Mesa de Partes</strong> antes de la fecha de vencimiento para entregar los documentos restantes.
            </p>
        </div>
    @endif
@endsection
