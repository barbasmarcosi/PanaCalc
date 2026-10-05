# PanaCalc

PanaCalc es una calculadora mobile-first de masas basada en porcentajes de panadero. Funciona completamente en el navegador, guarda fórmulas y la sesión actual en el dispositivo y puede instalarse como PWA para seguir usándose sin conexión.

## Qué calcula

Podés partir de dos datos distintos:

- **Masa total:** indicás cuántos gramos de masa querés obtener y PanaCalc calcula la harina y cada ingrediente.
- **Harina:** indicás cuántos gramos de harina tenés y PanaCalc calcula cada ingrediente y la masa final.

La harina es siempre la referencia **100%**. El agua arranca en **70%** y podés agregar cualquier cantidad de ingredientes adicionales.

Cada ingrediente puede expresarse como:

- **%:** porcentaje de panadero respecto de la harina; escala junto con la receta.
- **g:** cantidad absoluta en gramos; permanece fija aunque cambie el tamaño de la receta.

## Fórmulas guardadas

Las fórmulas se guardan en `localStorage`. Un preset conserva únicamente los ingredientes y sus cantidades, no el tamaño de la tanda. Por eso una misma fórmula puede reutilizarse con cualquier masa total o cantidad de harina.

También se guarda la sesión actual para recuperar el modo, el objetivo y la fórmula al volver a abrir la aplicación.

## Desarrollo

Requiere Node.js 24.

```bash
npm ci
npm run dev
```

Verificación completa:

```bash
npm run lint
npm test
npm run build
```

## PWA y uso offline

El build de producción genera un Web App Manifest y un service worker mediante `vite-plugin-pwa`. Después de una primera carga correcta, los recursos de la aplicación quedan precacheados para poder abrir PanaCalc sin conexión.

## Deploy gratuito

La producción está preparada para GitHub Pages mediante GitHub Actions.

URL prevista:

`https://barbasmarcosi.github.io/PanaCalc/`

El build usa la base `/PanaCalc/` para que assets, manifest y service worker funcionen bajo el subpath del repositorio. El workflow `.github/workflows/deploy-pages.yml` compila `dist/`, lo publica como artifact de Pages y lo despliega desde `main`.

Para un repositorio que todavía no tenga Pages habilitado, GitHub requiere una configuración inicial única en **Settings → Pages → Build and deployment → Source → GitHub Actions**.

No hay backend, servidor de aplicación ni base de datos que mantener.
