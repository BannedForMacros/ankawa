import { z } from 'zod';

/**
 * Esquema rápido de "campos obligatorios". Recibe { campo: 'mensaje' } y genera
 * un esquema Zod que marca cada campo vacío con su mensaje.
 *   const schema = requeridos({ nombre: 'El nombre es obligatorio.' });
 */
export function requeridos(map) {
    const shape = {};
    for (const k of Object.keys(map)) shape[k] = z.any();
    return z.object(shape).superRefine((d, ctx) => {
        for (const [campo, mensaje] of Object.entries(map)) {
            if (String(d[campo] ?? '').trim() === '') {
                ctx.addIssue({ code: 'custom', path: [campo], message: mensaje });
            }
        }
    });
}

/**
 * Valida `data` contra un esquema Zod y vuelca los errores en el formulario de
 * Inertia (setError) para mostrarlos EN LÍNEA bajo cada campo, todos a la vez.
 *
 *   if (!validarZod(usuarioSchema(editando), data, form)) return;
 *
 * @param {import('zod').ZodTypeAny} schema
 * @param {object} data
 * @param {{ setError: Function, clearErrors: Function }} form  (de useForm de Inertia)
 * @returns {boolean} true si es válido
 */
export function validarZod(schema, data, { setError, clearErrors }) {
    clearErrors?.();
    const res = schema.safeParse(data);
    if (res.success) return true;

    const errs = {};
    for (const issue of res.error.issues) {
        const campo = issue.path?.[0];
        if (campo != null && errs[campo] === undefined) {
            errs[campo] = issue.message; // primer mensaje por campo
        }
    }
    setError(errs);
    return false;
}
