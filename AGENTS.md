# GEMTTO - Flujo de Trabajo y Arquitectura del Proyecto

## 1. Estructura y Repositorios
Este proyecto consta de dos repositorios interconectados en el entorno de desarrollo:
- **Backend (API & Base de Datos)**:
  - Ruta local: `/Users/jerson/Desktop/Gemtto-back-org-master`
  - Repositorio Git: `https://github.com/leonardperez1992/gemtto-back.git` (rama `main`)
  - Tecnologías: Node.js, Express, MongoDB (Mongoose).
- **Frontend (Interfaz de Usuario)**:
  - Ruta local: `/Users/jerson/Desktop/Proyecto_Gemtto-main`
  - Repositorio Git: `https://github.com/leonardperez1992/GeMtto.git` (rama `main`)
  - Tecnologías: React, Redux, React Router, Vercel.

## 2. Flujo de Trabajo Obligatorio (Despliegue y Pruebas)
- El usuario valida y utiliza la aplicación principalmente a través de su entorno desplegado en **Vercel** conectado a GitHub.
- Cada vez que se complete una solicitud, mejora, ajuste de interfaz o corrección:
  1. **Actualizar el código fuente** en los repositorios correspondientes (Backend, Frontend o ambos).
  2. **Validar la compilación del frontend** ejecutando `CI=false npm run build` en `/Users/jerson/Desktop/Proyecto_Gemtto-main` para garantizar que no existan errores de sintaxis ni de empaquetado.
  3. **Hacer commit y git push origin main OBLIGATORIAMENTE** en los repositorios modificados para que Vercel y los servicios en la nube desplieguen y reflejen los cambios inmediatamente para el usuario.
  4. Mantener sincronía de diseño y comportamiento entre las vistas de Administrador (`Inventario.js`, `Cronograma.js`) y de Usuario de sede (`InventarioUser.js`, `Cronograma.js`).
