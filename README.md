
# 🏛️ Candidato.AI: War Room & Reputation Defense System

**Candidato.AI** es una plataforma de inteligencia política y defensa de reputación diseñada para equipos de campaña de alto nivel. Utiliza **Google Gemini 3 (Pro Preview)** para orquestar múltiples agentes de IA que analizan amenazas, gestionan la personalidad del candidato y generan respuestas estratégicas en tiempo real.

---

## 🧠 Blueprint: Pipeline del Modelo de IA

El núcleo del sistema no es un simple chatbot; es una **Arquitectura de Agentes Secuenciales** que sigue este flujo de datos:

### 1. Capa de Ingesta (The Scout Agent)
El proceso comienza cuando el usuario introduce una URL o sube una imagen.
*   **Análisis Visual (Multimodal):** Si se sube una imagen (meme, captura de pantalla), el sistema utiliza `gemini-3-pro-preview` con capacidades de visión para extraer el texto (OCR), identificar al autor y describir el contexto visual/sentimiento de la imagen.
*   **Grounding (Búsqueda):** Si se ingresa una URL, el agente utiliza la herramienta `googleSearch` para "leer" el contenido actual de la web, evadiendo alucinaciones y obteniendo el texto exacto del ataque.

### 2. Capa de Contexto (The Dynamic Persona Engine)
Antes de generar una respuesta, el sistema inyecta el "ADN" del candidato activo en el `System Prompt`.
*   **Personalidad:** Se carga el tono de voz (ej: "Paisa", "Técnico", "Estadista").
*   **Base de Conocimiento (RAG Ligero):** Se inyectan fragmentos del plan de gobierno, biografía y posturas previas definidos en el *Profile Manager*.
*   **Reglas de Seguridad:** Se aplican filtros estrictos para detectar temas legales sensibles (corrupción, fiscalía, paramilitarismo).

### 3. Capa de Inferencia (The Strategist)
El modelo `gemini-3-pro-preview` procesa la información y genera una salida estructurada en JSON que contiene:
*   **Análisis de Sentimiento:** Clasificación (Positivo, Negativo, Neutral, Troll).
*   **Nivel de Riesgo:** (Bajo, Medio, Alto). Si es Alto, activa banderas rojas para revisión legal.
*   **Matriz de Respuesta 5x:** Genera 5 variaciones de respuesta (Técnica, Frentera, Empática, Satírica, Viral).
*   **Acciones de Seguimiento:** Sugiere tácticas post-respuesta (ej. "Silenciar cuenta", "Emitir comunicado").

### 4. Capa de Interfaz (The UI Builder)
El frontend (React) renderiza los datos en tarjetas interactivas ("Glassmorphism UI"), permitiendo al estratega humano copiar, editar o descartar las opciones.

---

## 📖 Instrucciones de Funcionamiento

### 🔐 1. Acceso y Seguridad
*   **Login:** Al iniciar, ingrese las credenciales de seguridad (Por defecto en demo: `Usuario: TALLEYRAND`, `Clave: TALLEYRAND`).
*   **API Key:** El sistema requiere una `API_KEY` de Google AI Studio configurada en las variables de entorno para funcionar.

### 👤 2. Gestión de Perfiles (Profile Manager)
Antes de usar la Sala de Guerra, configure a su candidato:
1.  Navegue a la pestaña **Perfiles** en el menú lateral.
2.  Haga clic en **"Nuevo Candidato"** o edite el existente ("Mariate").
3.  **Avatar:** Suba una foto para identificar al agente.
4.  **Estilo (System Prompt):** Describa cómo habla el candidato. *Ej: "Directo, usa jerga local, no tolera mentiras, cita datos técnicos".*
5.  **Base de Conocimiento:** Pegue aquí el resumen del plan de gobierno, hoja de vida y posturas clave. **La IA usará esto para no contradecirse.**
6.  Haga clic en el perfil creado para activarlo (verá la etiqueta "ACTIVE").

### 🛡️ 3. Sala de Guerra (Defense Mode)
El módulo principal para responder ataques.
1.  **URL Objetivo:** Pegue el link del tweet/post a analizar y clic en "DESPLEGAR SCOUT".
2.  **Carga Visual:** Si el Scout falla (por bloqueos de la red social), tome un screenshot del post y súbalo en el recuadro "Explorador Visual".
3.  **Iniciar Protocolo:** Clic en "INICIAR PROTOCOLO DE DEFENSA".
4.  **Resultados:**
    *   Revise el **Nivel de Riesgo**. Si aparece la alerta roja 🚨, consulte con el equipo legal.
    *   Lea las **5 Opciones de Respuesta**.
    *   Seleccione la mejor opción y haga clic en **"COPY RESPONSE"** para llevarla al portapapeles y publicarla manualmente en la red social.

### 📊 4. Inteligencia de Redes (Network Analysis)
Módulo para analizar métricas masivas.
1.  Prepare un archivo `.csv` o `.json` con sus métricas.
2.  **Formato Requerido (CSV):** Debe tener cabeceras similares a:
    `Date, Platform, Impressions, Engagement, Sentiment, Topic`
3.  Arrastre el archivo al área de carga.
4.  El **Agente Campaign Manager** analizará los datos y generará:
    *   Gráficos de tendencia.
    *   Resumen ejecutivo en texto natural.
    *   Recomendaciones estratégicas basadas en los datos.

### 🗣️ 5. Traductor Político
Herramienta de utilidad diaria.
1.  Pegue un texto complejo o aburrido (ej: un párrafo de un proyecto de ley).
2.  Clic en "REWRITE TEXT".
3.  El sistema reescribirá el texto con la voz y personalidad del candidato activo.

---

## 🛠 Instalación Técnica

### Requisitos
*   Node.js 18+
*   Google Gemini API Key

### Pasos
1.  Clonar repositorio.
2.  `npm install`
3.  Crear archivo `.env` en la raíz:
    ```env
    API_KEY=su_clave_de_google_aistudio
    ```
4.  `npm start` o `npm run dev`

### Stack Tecnológico
*   **Frontend:** React 19, TypeScript, Tailwind CSS.
*   **AI:** Google GenAI SDK (`@google/genai`).
*   **Gráficos:** Recharts.
*   **Build:** Vite.

---

**Nota:** Este sistema está diseñado bajo la filosofía "Human-in-the-loop". La IA sugiere, pero el estratega humano decide y publica.
