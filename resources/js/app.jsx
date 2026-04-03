import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { useState, useEffect, useRef } from 'react';
import AnkawaLoader from '@/Components/AnkawaLoader';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

function InertiaLoader() {
    const [visible, setVisible] = useState(false);
    const timer = useRef(null);

    useEffect(() => {
        const startHandler = router.on('start', () => {
            timer.current = setTimeout(() => setVisible(true), 300);
        });
        const finishHandler = router.on('finish', () => {
            clearTimeout(timer.current);
            setVisible(false);
        });
        return () => {
            startHandler();
            finishHandler();
            clearTimeout(timer.current);
        };
    }, []);

    return <AnkawaLoader visible={visible} />;
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <>
                <InertiaLoader />
                <App {...props} />
            </>
        );
    },
    progress: false,
});
