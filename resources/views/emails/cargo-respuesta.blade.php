@extends('emails.layout')

@section('fields')
    <tr>
        <td class="field-label">Número de Registro</td>
        <td class="field-value" style="font-family: monospace; font-weight: bold; font-size: 13px;">{{ $cargo->numero_cargo }}</td>
    </tr>
    <tr>
        <td class="field-label">Expediente</td>
        <td class="field-value">{{ $movimiento->expediente?->numero_expediente ?? '—' }}</td>
    </tr>
    <tr>
        <td class="field-label">Sumilla</td>
        <td class="field-value">{{ Str::limit($movimiento->instruccion, 120) }}</td>
    </tr>
    <tr style="border-bottom: none;">
        <td class="field-label">Fecha y Hora</td>
        <td class="field-value">{{ now()->format('d/m/Y H:i') }}</td>
    </tr>
@endsection
