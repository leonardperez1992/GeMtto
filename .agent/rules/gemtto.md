---
trigger: always_on
---

# Reglas del proyecto GEMTTO

- Responde en español y conserva los patrones existentes del proyecto.
- Este workspace contiene el frontend: React 17, Redux, React Router y Create React App. El backend Node.js/Express/MongoDB está en un repositorio separado; no asumas que puedes modificarlo desde aquí.
- Antes de editar, revisa el componente y las utilidades cercanas que controlan el comportamiento solicitado. Mantén los cambios acotados y evita refactorizaciones no relacionadas.
- Si un cambio afecta inventario o cronograma, considera las vistas de administrador y de usuario de sede para mantenerlas sincronizadas.
- Para validar cambios del frontend, ejecuta `CI=false npm run build` desde la raíz de este repositorio y reporta cualquier error que impida completarlo.
- No publiques secretos ni modifiques archivos de entorno con credenciales.
- No hagas commit, push ni despliegues sin autorización explícita del usuario.
