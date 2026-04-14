<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\RolModuloPermiso;
use App\Models\Modulo;
use App\Support\FileRules;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user'     => $request->user(),
                'permisos' => $request->user() ? $this->getPermisosUsuario($request->user()) : [],
                'menu'     => $request->user() ? $this->getMenuUsuario($request->user()) : [],
            ],
            'flash' => [
                'success' => session('success'),
                'error'   => session('error'),
            ],
            'upload_accept'  => FileRules::acceptAttr(),
            'upload_max_mb'  => config('uploads.max_size_mb'),
            'upload_mimes'   => config('uploads.allowed_mimes'), // ['pdf','png','jpg','jpeg']
        ];
    }

    private function getPermisosUsuario($user): array
    {
        return RolModuloPermiso::with('modulo')
            ->where('rol_id', $user->rol_id)
            ->get()
            ->mapWithKeys(fn($p) => [
                $p->modulo->slug => [
                    'ver'      => (bool) $p->ver,
                    'crear'    => (bool) $p->crear,
                    'editar'   => (bool) $p->editar,
                    'eliminar' => (bool) $p->eliminar,
                ]
            ])
            ->toArray();
    }

    private function getMenuUsuario($user): array
    {
        // Traer solo módulos padre (parent_id = null) activos
        // con sus hijos donde el usuario tenga ver = 1
        $modulosPadre = Modulo::where('parent_id', null)
            ->where('activo', 1)
            ->orderBy('orden')
            ->with(['submodulos' => function ($q) {
                $q->where('activo', 1)->orderBy('orden');
            }])
            ->get();

        return $modulosPadre->map(function ($padre) use ($user) {
            $hijosVisibles = $padre->submodulos->filter(function ($hijo) use ($user) {
                return RolModuloPermiso::where('rol_id', $user->rol_id)
                    ->where('modulo_id', $hijo->id)
                    ->where('ver', 1)
                    ->exists();
            })->values();

            // Módulo sin hijos: enlace directo si tiene ruta y permiso propio
            if ($hijosVisibles->isEmpty()) {
                $tienePermiso = RolModuloPermiso::where('rol_id', $user->rol_id)
                    ->where('modulo_id', $padre->id)
                    ->where('ver', 1)
                    ->exists();

                if (!$tienePermiso || !$padre->ruta) return null;

                return [
                    'id'     => $padre->id,
                    'nombre' => $padre->nombre,
                    'slug'   => $padre->slug,
                    'icono'  => $padre->icono,
                    'ruta'   => $padre->ruta,
                    'hijos'  => [],
                ];
            }

            return [
                'id'     => $padre->id,
                'nombre' => $padre->nombre,
                'slug'   => $padre->slug,
                'icono'  => $padre->icono,
                'hijos'  => $hijosVisibles->map(fn($h) => [
                    'id'     => $h->id,
                    'nombre' => $h->nombre,
                    'slug'   => $h->slug,
                    'icono'  => $h->icono,
                    'ruta'   => $h->ruta,
                ])->toArray(),
            ];
        })
        ->filter()
        ->values()
        ->toArray();
    }
}