import axios from 'axios';

/**
 * Consulta un DNI/RUC/CE contra el proxy RENIEC/SUNAT (`consulta.documento`).
 *
 * Centraliza la única llamada que estaba copiada en ~10 lugares de los formularios
 * de Mesa de Partes. Devuelve el `data` de la respuesta tal cual
 * (`{ nombre, documento, domicilio?, estado?, condicion? }`) y deja propagar el
 * error de axios sin envolverlo, para que los `catch` que inspeccionan
 * `err.response?.status` (p. ej. distinguir 404) sigan funcionando igual.
 *
 * @param {'dni'|'ruc'|'ce'} tipo
 * @param {string} numero
 * @returns {Promise<object>} data de la respuesta
 */
export async function consultarDocumento(tipo, numero) {
    const { data } = await axios.get(route('consulta.documento'), { params: { tipo, numero } });
    return data;
}
