# Producción — CARD ANKAWA

Checklist de todo lo que hay que **levantar y configurar** para que el sistema
funcione en producción, con foco en lo que no es obvio (Reverb / WebSockets y la
cola). Documento operativo, no de arquitectura.

> Stack: Laravel 12 · PHP 8.2+ · PostgreSQL · Inertia + React (Vite) · Laravel Reverb (WebSockets)

---

## 1. Procesos que DEBEN estar corriendo

En producción no basta con el servidor web. Hay que mantener **3 procesos**
vivos y supervisados (que se reinicien solos si se caen):

| Proceso | Comando | Para qué | ¿Crítico? |
|---------|---------|----------|-----------|
| **Servidor web** | PHP-FPM + Nginx (o `php artisan serve` solo en dev) | Servir la app HTTP | Sí — sin esto no hay app |
| **Reverb** | `php artisan reverb:start` | Servidor WebSocket (notificaciones en tiempo real) | Sí — sin esto no hay "tiempo real" |
| **Cola** | `php artisan queue:work` | Procesa lo encolado (ver §4) | Sí — ver abajo |

> ⚠️ **Importante:** estos procesos NO se levantan solos. Hay que dejarlos como
> servicios supervisados (Supervisor o systemd). Ver §5.

### ¿Qué pasa si falta cada uno?

- **Sin Reverb** → la app sigue funcionando, pero **no hay tiempo real**. La
  campana del staff y los avisos del portal externo solo se ven al recargar la
  página. Todo degrada con gracia (no rompe nada), pero se pierde el "en vivo".
- **Sin `queue:work`** → ver §4. En resumen: la campana del staff deja de
  actualizarse en vivo (solo al recargar) y un email puntual no sale.

---

## 2. Reverb (WebSockets) — lo que más cambia en producción

En desarrollo Reverb corre en `localhost:8085` por `ws://` (sin cifrar). En
producción, detrás de un dominio con HTTPS, el navegador **exige `wss://`** (WebSocket
seguro), así que la configuración cambia.

### Cómo funciona el despliegue recomendado

Reverb escucha **internamente** en un puerto local (ej. `8085`) y **Nginx hace
de proxy** para exponerlo de forma segura por el puerto 443 (HTTPS/WSS) bajo el
mismo dominio. Así el navegador se conecta a `wss://tudominio.com` y Nginx
reenvía al Reverb interno.

### `.env` de producción — bloque Reverb

```env
BROADCAST_CONNECTION=reverb

# Credenciales de la app Reverb (mantener los mismos valores en todos los procesos)
REVERB_APP_ID=122903
REVERB_APP_KEY=<la-misma-key>
REVERB_APP_SECRET=<el-mismo-secret>

# Dónde escucha el proceso Reverb INTERNAMENTE (no se expone directo a internet)
REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8085

# Host/puerto/scheme PÚBLICOS — lo que Reverb anuncia y por donde firma
REVERB_HOST="tudominio.com"
REVERB_PORT=443
REVERB_SCHEME=https

# Lo que ve el navegador (compilado por Vite en el build) — DEBE apuntar al dominio público con WSS
VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="tudominio.com"
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https
```

> 🔑 Las variables `VITE_*` se **incrustan en el JavaScript compilado**. Si las
> cambias, hay que **recompilar** los assets (`npm run build`) — no basta con
> reiniciar PHP.

### Bloque Nginx para hacer proxy del WebSocket

Dentro del `server { ... }` del dominio (el mismo que ya tiene el cert SSL):

```nginx
location /app {
    proxy_pass http://127.0.0.1:8085;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_read_timeout 60s;
}
```

> El cliente de Reverb (Pusher protocol) se conecta a la ruta `/app/{key}`, por
> eso el `location /app`.

---

## 3. Variables `.env` críticas de producción (fuera de Reverb)

```env
APP_ENV=production
APP_DEBUG=false                 # NUNCA true en producción
APP_URL=https://tudominio.com
APP_KEY=<generada con: php artisan key:generate>

# Base de datos PostgreSQL (recordatorio del proyecto: NO ejecutar migrate a ciegas)
DB_CONNECTION=pgsql
DB_HOST=...
DB_PORT=5432
DB_DATABASE=ankawa
DB_USERNAME=...
DB_PASSWORD=...

QUEUE_CONNECTION=database        # la cola usa la tabla `jobs` de Postgres
SESSION_DRIVER=database          # (o el que uses)

# Correo real (los emails de cédulas, credenciales, cargos se envían en serio)
MAIL_MAILER=smtp
MAIL_HOST=...
MAIL_PORT=...
MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_FROM_ADDRESS=...
MAIL_FROM_NAME="The Ankawa Global Group"
```

---

## 4. Qué hace el `queue:work` en este proyecto (estado actual)

Hoy el proyecto encola **muy poco** (no hay `app/Jobs/`, ni clases `ShouldQueue`
propias). El worker procesa exactamente **dos cosas**:

1. **El broadcast en vivo de la campana del staff interno.** La notificación se
   guarda síncrona en BD (la campana siempre aparece al recargar), pero el "pop"
   en tiempo real viaja por `BroadcastNotificationCreated`, que Laravel **encola**.
   → **Sin worker, el staff no recibe el aviso en vivo, solo al recargar.**
   (El portal externo NO depende de esto: usa `ShouldBroadcastNow`, es síncrono.)

2. **Un único email encolado:** el cargo del servicio "Otros"
   (`CargoSolicitudOtrosMail` en `SolicitudOtrosController`). El resto de correos
   del sistema usan `Mail::send` (síncronos) por convención del proyecto.

> Conclusión: el worker hace poco hoy, pero ese poco importa. Y es la base para
> cualquier job/broadcast futuro. Déjalo siempre corriendo.

---

## 5. Supervisión de procesos (Supervisor)

Ejemplo con **Supervisor** (`/etc/supervisor/conf.d/ankawa.conf`). Ajustar
rutas, usuario y `php` según el servidor.

```ini
[program:ankawa-reverb]
process_name=%(program_name)s
command=php /var/www/ankawa/artisan reverb:start
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/www/ankawa/storage/logs/reverb.log
stopwaitsecs=10

[program:ankawa-queue]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/ankawa/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/ankawa/storage/logs/queue.log
stopwaitsecs=3600
```

Recargar Supervisor tras crear el archivo:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl status        # verificar que ambos estén RUNNING
```

> Tras cada **deploy de código nuevo** hay que reiniciar el worker para que tome
> los cambios: `sudo supervisorctl restart ankawa-queue:*`
> (Reverb también conviene reiniciarlo si cambia su config: `restart ankawa-reverb`.)

---

## 6. Pasos de despliegue (deploy)

```bash
# 1. Traer código
git pull origin master

# 2. Dependencias PHP (sin paquetes de dev, optimizado)
composer install --no-dev --optimize-autoloader

# 3. Dependencias JS y BUILD de assets (incrusta las VITE_REVERB_* públicas)
npm ci
npm run build

# 4. Migraciones — OJO: regla del proyecto, NO correr migrate a ciegas.
#    Verificar la estructura con psql primero. Coordinar con el equipo.
#    (Conexión: PGPASSWORD=... psql -U postgres -h 127.0.0.1 -d ankawa)

# 5. Cachés de Laravel (acelera producción)
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 6. Reiniciar procesos para que tomen el código nuevo
sudo supervisorctl restart ankawa-queue:*
sudo supervisorctl restart ankawa-reverb
# y recargar PHP-FPM / Nginx según corresponda
```

> ⚠️ Si usas `config:cache`, cualquier cambio posterior en `.env` **no surte
> efecto** hasta volver a correr `php artisan config:cache` (o `config:clear`).

---

## 7. Verificación rápida post-deploy (smoke test)

1. La app carga por `https://tudominio.com` sin errores de mixed-content.
2. **Reverb conectado:** abrir la app como staff, consola del navegador → la
   conexión WebSocket a `wss://tudominio.com/app/...` debe quedar en estado
   `connected` (no en reintentos).
3. **Campana staff en vivo:** generar un evento que notifique a un usuario (ej.
   una respuesta desde el portal) → el badge debe saltar **sin recargar**.
4. **Portal externo en vivo:** parte externa logueada en Mesa de Partes; un
   gestor le crea un requerimiento → debe aparecer toast + actualizarse la
   bandeja **sin recargar**.
5. **Cola viva:** `sudo supervisorctl status` muestra `ankawa-queue` RUNNING;
   `php artisan queue:failed` sin acumulación de fallos.

---

## 8. Resumen de un vistazo

- [ ] Nginx + PHP-FPM sirviendo la app por HTTPS
- [ ] `php artisan reverb:start` supervisado (proceso vivo)
- [ ] Nginx con `location /app` haciendo proxy a Reverb interno (puerto 8085)
- [ ] `php artisan queue:work` supervisado (proceso vivo)
- [ ] `.env` con `APP_DEBUG=false`, `APP_ENV=production`, `APP_KEY` generada
- [ ] `VITE_REVERB_*` apuntando al dominio público con `https`/`wss` y assets recompilados (`npm run build`)
- [ ] Credenciales `REVERB_APP_*` idénticas en todos los procesos
- [ ] Smoke test §7 pasado
