/**
 * ConfigHeader — Alias de PageHeader para las pantallas de Configuración.
 *
 * Delgado a propósito: delega todo en PageHeader (el hero de marca estándar de
 * toda la app) fijando la imagen temática de la sección Configuración. Las
 * páginas de Configuración no necesitan cambiar sus imports ni sus props.
 *
 * Props: las mismas de PageHeader (breadcrumb, title, titleAccent, description,
 * action, actions). La imagen se puede sobreescribir con `image` si algún día
 * una pantalla necesita la suya propia.
 */

import PageHeader from '@/Components/PageHeader';

export default function ConfigHeader({ image = '/images/backgrounds/hero-config.jpg', ...props }) {
    return <PageHeader image={image} {...props} />;
}
