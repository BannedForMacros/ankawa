import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
// CSRF: axios envía automáticamente X-XSRF-TOKEN leyendo la cookie XSRF-TOKEN
// (Laravel la rota en cada respuesta). NO fijar X-CSRF-TOKEN del meta tag aquí
// porque queda obsoleto si la sesión rota y Laravel le da prioridad sobre la cookie,
// causando "CSRF token mismatch" intermitente (p. ej. al rechazar envíos).
