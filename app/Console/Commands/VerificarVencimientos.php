<?php

namespace App\Console\Commands;

use App\Models\ExpedienteInstancia;
use Illuminate\Console\Command;

class VerificarVencimientos extends Command
{
    protected $signature   = 'flujo:verificar-vencimientos';
    protected $description = 'Detecta expedientes cuya actividad actual ha superado o está próxima a su plazo.';

    public function handle(): int
    {
        $instancias = ExpedienteInstancia::where('activa', true)
            ->whereNotNull('fecha_vencimiento')
            ->with(['expediente', 'actividad'])
            ->get();

        $vencidos = [];
        $proximos = []; // vencen en los próximos 3 días

        foreach ($instancias as $inst) {
            $diasRestantes = (int) now()->diffInDays($inst->fecha_vencimiento, false);

            $row = [
                'exp_id'         => $inst->expediente_id,
                'numero'         => $inst->expediente?->numero_expediente ?? "EXP-{$inst->expediente_id}",
                'actividad'      => $inst->actividad?->nombre ?? '—',
                'dias_restantes' => $diasRestantes,
                'vencimiento'    => $inst->fecha_vencimiento->format('d/m/Y'),
            ];

            if ($diasRestantes < 0) {
                $vencidos[] = $row;
            } elseif ($diasRestantes <= 3) {
                $proximos[] = $row;
            }
        }

        $this->newLine();
        $this->line("  Instancias activas con plazo : <info>{$instancias->count()}</info>");
        $this->newLine();

        if (!empty($vencidos)) {
            $this->error(" VENCIDOS (" . count($vencidos) . ") ");
            $this->table(
                ['ID', 'Número', 'Actividad', 'Días vencido', 'Venció el'],
                array_map(fn($r) => [$r['exp_id'], $r['numero'], $r['actividad'], abs($r['dias_restantes']), $r['vencimiento']], $vencidos)
            );
        } else {
            $this->info('  No hay expedientes vencidos.');
        }

        $this->newLine();

        if (!empty($proximos)) {
            $this->warn(" PRÓXIMOS A VENCER (" . count($proximos) . ") ");
            $this->table(
                ['ID', 'Número', 'Actividad', 'Días restantes', 'Vence el'],
                array_map(fn($r) => [$r['exp_id'], $r['numero'], $r['actividad'], $r['dias_restantes'], $r['vencimiento']], $proximos)
            );
        }

        $this->newLine();

        return Command::SUCCESS;
    }
}
