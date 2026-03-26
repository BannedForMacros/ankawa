<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expediente_movimientos', function (Blueprint $table) {
            $table->string('tipo', 20)->default('requerimiento')->after('expediente_id');
            $table->boolean('enviar_credenciales')->default(false)->after('estado');
            $table->boolean('credenciales_enviadas')->default(false)->after('enviar_credenciales');
        });
    }

    public function down(): void
    {
        Schema::table('expediente_movimientos', function (Blueprint $table) {
            $table->dropColumn(['tipo', 'enviar_credenciales', 'credenciales_enviadas']);
        });
    }
};
