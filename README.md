🧠 Oracle Quiz Solver

Herramienta educativa que combina una extensión de Chrome con un backend FastAPI y una estrategia de IA híbrida basada en Google Gemini + Ollama para analizar y resolver preguntas de quizzes de Oracle Academy.

⚠️ Disclaimer: Esta herramienta está destinada únicamente a uso educativo y personal. El usuario es responsable de cumplir los términos de servicio de Oracle Academy y las políticas académicas de su institución.

📁 Estructura del proyecto

oracle-quiz-solver/


├── backend/

│   ├── main.py

│   ├── ai_service.py

│   ├── config.py

│   ├── models.py

│   ├── requirements.txt

│   ├── .env.example

│   └── .gitignore

│

├── extension/

│   ├── manifest.json

│   ├── content.js

│   └── .gitignore

│

├── .gitignore

└── README.md

✨ Características
🤖 Integración con Google Gemini
🦙 Soporte para modelos locales mediante Ollama
🔄 Sistema de fallback automático entre Gemini y Ollama
🧠 Base de conocimiento para recordar respuestas incorrectas
🌐 Extensión compatible con navegadores basados en Chromium
⚡ Resolución de preguntas individuales
🚀 Modo de auto-resolución de quizzes
💾 Persistencia local de información
🔌 API REST desarrollada con FastAPI
🛠️ Tecnologías
Componente	Tecnología
Backend	Python 3.12+
API	FastAPI
Servidor	Uvicorn
Cliente HTTP	HTTPX
IA en la nube	Google Gemini
IA local	Ollama
Extensión	Chrome Extension API Manifest V3
Frontend	JavaScript Vanilla
Persistencia	JSON / sessionStorage
📋 Requisitos

Antes de comenzar, asegúrate de tener instalado:

Python 3.12 o superior
Ollama
Chrome, Edge o Brave
Una cuenta de Google para obtener una API key de Gemini
Windows, Linux o macOS
Ollama

Descarga Ollama desde:

https://ollama.com/download

🚀 Instalación
1. Clonar el repositorio
git clone https://github.com/tu-usuario/oracle-quiz-solver.git
cd oracle-quiz-solver

2. Instalar Ollama y descargar un modelo

Puedes utilizar cualquiera de los modelos configurados para el proyecto.

Mistral 7B — recomendado
ollama pull mistral:7b

Llama 3.1 8B — alternativa
ollama pull llama3.1:8b


Comprueba que el modelo esté instalado:

ollama list

⚙️ Configuración del backend
3. Crear el entorno virtual

Desde la carpeta del backend:

cd backend


Crear el entorno virtual:

python -m venv venv

Windows
venv\Scripts\activate

Linux / macOS
source venv/bin/activate


Cuando el entorno esté activo deberías ver algo similar a:

(venv)

4. Instalar dependencias
pip install -r requirements.txt

5. Configurar las variables de entorno
Windows
copy .env.example .env

Linux / macOS
cp .env.example .env


Después abre:

backend/.env


y configura los valores necesarios.

Ejemplo:

GEMINI_API_KEY=AIzaSyTuKeyRealAqui
GEMINI_MODEL=gemini-3.8-flash

OLLAMA_MODEL=mistral:7b

MIN_DELAY_SECONDS=20
MAX_DELAY_SECONDS=120


🔐 Nunca publiques tu archivo .env ni tu API key en GitHub.

🔑 Obtener una API Key de Gemini
Accede a Google AI Studio:
https://aistudio.google.com/app/apikey
Inicia sesión con tu cuenta de Google.
Selecciona Create API Key.
Copia la API key.
Añádela al archivo .env.

Ejemplo:

GEMINI_API_KEY=AIzaSyTuKeyRealAqui

▶️ Iniciar el backend

Desde backend/, con el entorno virtual activado:

python main.py


Si todo está configurado correctamente, deberías obtener una salida similar a:

📁 Base de conocimiento: C:\...\backend\knowledge_base.json
✅ Gemini configurado: gemini-3.8-flash
INFO:     Started server process
INFO:     Uvicorn running on http://127.0.0.1:8000


El backend estará disponible en:

http://127.0.0.1:8000


⚠️ Mantén esta terminal abierta mientras utilices la extensión.

🌐 Instalar la extensión de Chrome
Abre:
chrome://extensions/

Activa Modo de desarrollador.
Selecciona Cargar descomprimida.
Selecciona la carpeta:
oracle-quiz-solver/extension/

La extensión aparecerá en la lista de extensiones instaladas.

La extensión también debería funcionar en otros navegadores basados en Chromium, como Edge o Brave.

🎯 Uso
Resolver una pregunta
Accede a Oracle Academy.
Navega hasta un quiz.
En la esquina inferior izquierda aparecerán los controles de la extensión.
Pulsa:
🧠 Resolver Pregunta


La extensión analizará la pregunta actual y tratará de determinar la respuesta.

🚀 Auto-Resolver Quiz

Para iniciar el modo automático:

Pulsa:
🚀 Auto-Resolver Quiz

El botón cambiará a:
⏹️ Detener

La extensión podrá procesar secuencialmente las preguntas.

El flujo previsto es:

Detectar pregunta
      ↓
Extraer pregunta y opciones
      ↓
Enviar al backend
      ↓
Gemini
      ↓
Si falla → Ollama
      ↓
Seleccionar respuesta
      ↓
Submit
      ↓
Siguiente pregunta
      ↓
Finalizar quiz
      ↓
Guardar información de errores

⏹️ Detener la auto-resolución

En cualquier momento puedes pulsar:

⏹️ Detener


para detener el proceso automático.

🤖 Estrategia de IA híbrida

El backend utiliza dos sistemas de IA.

             ┌───────────────┐
             │   Pregunta    │
             └───────┬───────┘
                     │
                     ▼
             ┌───────────────┐
             │    Gemini     │
             │    (Cloud)    │
             └───────┬───────┘
                     │
              ¿Respuesta?
               /       \
             Sí         No
             │           │
             ▼           ▼
          Respuesta    Ollama
                       (Local)
                         │
                         ▼
                     Respuesta

Prioridad
Se intenta utilizar Gemini primero.
Si Gemini falla, por ejemplo por cuota agotada o timeout, se intenta Ollama.
Las respuestas obtenidas pueden utilizarse junto con la base de conocimiento local.
🧠 Sistema de aprendizaje

El proyecto incluye una base de conocimiento:

knowledge_base.json


La idea es almacenar información relacionada con preguntas que hayan producido respuestas incorrectas.

Después de finalizar un quiz, el sistema puede:

Detectar la información relacionada con los errores.
Extraer las preguntas.
Registrar las respuestas asociadas.
Guardar la información en knowledge_base.json.
Utilizar esa información en futuras ejecuciones.

Esto permite que el sistema tenga una referencia histórica y evite repetir determinados errores conocidos.

⚙️ Configuración
Cambiar el modelo de Gemini

Edita:

backend/.env


Por ejemplo:

GEMINI_MODEL=gemini-3.8-flash


También puedes probar otros modelos disponibles para tu configuración:

# GEMINI_MODEL=gemini-2.5-flash
# GEMINI_MODEL=gemini-flash-latest
# GEMINI_MODEL=gemini-flash-lite-latest


Los nombres y límites de modelos disponibles pueden cambiar con el tiempo. Comprueba siempre la documentación actual de Google antes de configurar un modelo nuevo.

Cambiar el modelo de Ollama
OLLAMA_MODEL=mistral:7b


O:

OLLAMA_MODEL=llama3.1:8b

Ajustar los delays

Los tiempos mínimos y máximos pueden configurarse mediante:

MIN_DELAY_SECONDS=20
MAX_DELAY_SECONDS=120

Utilizar únicamente Ollama

Si quieres desactivar Gemini, deja vacía la API key:

GEMINI_API_KEY=


De esta forma, el backend puede utilizar Ollama como proveedor local.

🏗️ Arquitectura
┌─────────────────────────┐
│    Extensión Chrome     │
│       content.js        │
└────────────┬────────────┘
             │
             │ HTTP
             ▼
┌─────────────────────────┐
│      FastAPI Backend    │
│         main.py         │
└────────────┬────────────┘
             │
       ┌─────┴─────┐
       │           │
       ▼           ▼
┌───────────┐ ┌───────────┐
│  Gemini   │ │  Ollama   │
│   API     │ │   Local   │
└───────────┘ └───────────┘

🔌 API

El backend expone los siguientes endpoints:

Método	Endpoint	Descripción
GET	/health	Comprueba el estado del backend
POST	/solve	Procesa preguntas
POST	/learn	Guarda información de aprendizaje
GET	/knowledge_count	Consulta la cantidad de preguntas almacenadas
GET /health

Comprueba si el backend está funcionando.

GET http://localhost:8000/health

POST /solve

Ejemplo:

curl -X POST http://localhost:8000/solve \
  -H "Content-Type: application/json" \
  -d '{
    "questions": [{
      "id": "1",
      "text": "What is SQL?",
      "type": "single_choice",
      "options": [
        "Database",
        "Language",
        "Framework",
        "Tool"
      ]
    }]
  }'

POST /learn

Este endpoint permite registrar información obtenida durante el proceso de aprendizaje.

GET /knowledge_count

Devuelve la cantidad de preguntas almacenadas en la base de conocimiento.

📊 Rendimiento

Los tiempos dependen del hardware, conexión y modelo utilizado.

Modelo	Velocidad aproximada	Tipo
Gemini Flash	1–3 s	Cloud
Ollama Mistral 7B	15–30 s	Local
Ollama Llama 3.1 8B	20–40 s	Local

Estos valores son orientativos y pueden variar considerablemente.

💻 Requisitos de hardware para Ollama

Para ejecutar modelos localmente se recomienda:

RAM: 8 GB mínimo
RAM: 16 GB recomendado
GPU: opcional, pero puede mejorar considerablemente el rendimiento
Disco: aproximadamente 5 GB por modelo, dependiendo del modelo utilizado
⚠️ Limitaciones
Cuotas de Gemini

Las cuotas dependen del modelo, cuenta y plan utilizado. No asumas que todos los modelos tienen exactamente el mismo límite.

Si recibes un error similar a:

429 RESOURCE_EXHAUSTED


puedes:

Esperar a que se restablezca la cuota.
Utilizar otro modelo disponible.
Utilizar Ollama.
Revisar los límites actuales de tu proyecto en Google AI Studio.
🐛 Solución de problemas
El backend no inicia

Comprueba que estás en la carpeta correcta:

cd backend


Comprueba que el entorno virtual esté activo.

En Windows:

venv\Scripts\activate


Después:

pip install -r requirements.txt
python main.py

ERR_CONNECTION_REFUSED

Normalmente significa que la extensión no puede conectarse al backend.

Comprueba que el servidor esté ejecutándose:

python main.py


y que esté disponible en:

http://127.0.0.1:8000

429 RESOURCE_EXHAUSTED

La cuota del proveedor de Gemini puede haberse agotado.

Prueba:

Esperar al restablecimiento de cuota.
Cambiar de modelo.
Configurar Ollama.
Desactivar Gemini:
GEMINI_API_KEY=

Ollama no responde

Comprueba los modelos instalados:

ollama list


También puedes probar directamente un modelo:

ollama run mistral:7b


Si Ollama no está iniciado, inicia su aplicación/servicio según tu sistema operativo.

La extensión no funciona

Comprueba lo siguiente:

El backend está ejecutándose.
Ollama está disponible si estás utilizando el fallback local.
La extensión está instalada.
Recarga la extensión desde:
chrome://extensions/

Recarga la página del quiz.

En Chrome puedes hacer una recarga completa con:

Ctrl + Shift + R


