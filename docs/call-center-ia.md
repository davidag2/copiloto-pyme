# Call Center IA De Copiloto Pyme

## Objetivo

Crear una linea telefonica de Copiloto Pyme administrada por IA de voz para atender llamadas de ventas, soporte, quejas y reclamos. La persona llama al numero publicado en el sitio web, recibe informacion clara del producto y, si necesita ayuda, el sistema registra el caso en el panel superadmin de Tecnotitan S.A.S.

## Alcance Del Paso 1

Este documento define el alcance funcional del mini call center. No activa todavia Twilio, OpenAI Voice ni endpoints de produccion. Sirve como base para construir los siguientes pasos sin improvisar reglas, datos o flujos.

## Paso 2: Linea Telefonica Twilio

### Decision Recomendada

Para produccion, Copiloto Pyme debe usar una linea de voz en Twilio con capacidad de llamadas entrantes. La opcion preferida es un numero local colombiano o toll-free colombiano si esta disponible en la cuenta de Twilio y cumple los requisitos regulatorios.

Orden recomendado:

1. Buscar numero de Colombia en Twilio Console.
2. Priorizar numero local con voz entrante.
3. Si no hay disponibilidad inmediata, revisar opcion toll-free Colombia.
4. Si Twilio exige documentos, completar el registro regulatorio antes de conectar produccion.
5. Solo usar un numero internacional temporal para pruebas internas.

### Por Que Esta Decision

El call center necesita que un cliente en Colombia pueda llamar de forma sencilla. Un numero colombiano aumenta confianza, reduce friccion comercial y hace que el canal se sienta local para PYMES.

### Validaciones Antes De Comprar

En Twilio Console se debe confirmar:

- Pais: Colombia.
- Capacidad: Voice.
- Tipo: local o toll-free.
- Llamadas entrantes habilitadas.
- Requisitos regulatorios pendientes.
- Precio mensual del numero.
- Precio por minuto de llamadas entrantes.
- Si el numero puede usarse con TwiML, Voice Webhook o ConversationRelay.

### Costos De Referencia

Segun precios publicos de Twilio para Colombia consultados el 31 de mayo de 2026:

- Numero local Colombia: aproximadamente USD 14 al mes.
- Numero toll-free Colombia: aproximadamente USD 25 al mes.
- Recibir llamadas en numero local: aproximadamente USD 0.0945 por minuto.
- Recibir llamadas en toll-free: aproximadamente USD 0.1792 por minuto.

Estos valores deben revisarse en Twilio antes de produccion porque pueden cambiar.

### Configuracion Inicial En Twilio

Despues de comprar o asignar el numero:

1. Ir a Twilio Console.
2. Entrar a Phone Numbers > Manage > Active numbers.
3. Abrir el numero de Copiloto Pyme.
4. En Voice Configuration, seleccionar webhook.
5. Configurar el endpoint de llamadas entrantes cuando exista:

```text
https://copilotopyme.com/api/voice/incoming
```

6. Metodo recomendado:

```text
POST
```

7. Guardar el numero comprado como numero oficial del call center.

### Variables Que Necesitara Vercel

Cuando pasemos a implementacion tecnica, se deben crear estas variables:

```text
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_CALL_CENTER_NUMBER=
TWILIO_VOICE_WEBHOOK_SECRET=
OPENAI_API_KEY=
VOICE_AGENT_ENABLED=true
```

Si despues usamos ConversationRelay con WebSocket, tambien necesitaremos:

```text
VOICE_RELAY_WS_URL=wss://copilotopyme.com/api/voice/relay
```

### Nombre Comercial De La Linea

La linea debe identificarse internamente como:

```text
Copiloto Pyme Call Center IA
```

### Uso Inicial Del Numero

El numero se usara para:

- Consultas comerciales.
- Explicacion de planes.
- Solicitud de demo.
- Soporte de cuenta.
- Quejas y reclamos.
- Emergencias criticas.

No se usara inicialmente para:

- Cobros automaticos.
- Verificacion OTP.
- Llamadas masivas salientes.
- Marketing telefonico masivo.

### Estado Del Paso 2

Queda definido que el producto necesita una linea de voz Twilio dedicada, preferiblemente colombiana, validada en Twilio Console antes de construir endpoints definitivos.

## Casos De Uso Principales

### 1. Ventas

El asistente debe poder explicar:

- Que es Copiloto Pyme.
- Para que sirve el sistema operativo para administrar la PYME con IA.
- Que modulos existen: Inicio, Ventas, Caja, Equipo, Datos, Reportes, Alertas, Configuracion, Inventario, Clientes y Proyecciones.
- Como funciona la prueba gratis de un mes.
- Que incluye cada plan: Go, Basic y Pro.
- Como solicitar una demo o crear una cuenta.

### 2. Soporte

El asistente debe poder recibir:

- Problemas para iniciar sesion.
- Dudas sobre registro, onboarding o planes.
- Problemas con importacion de datos.
- Fallos con pagos, facturas o acceso al dashboard.
- Solicitudes para hablar con soporte humano.

### 3. Quejas Y Reclamos

El asistente debe identificar y registrar:

- Quejas por cobros, facturacion o cancelacion.
- Reclamos por acceso bloqueado.
- Inconformidades con soporte.
- Reportes de errores graves en la plataforma.
- Solicitudes formales de seguimiento.

### 4. Emergencias Criticas

El asistente debe escalar de inmediato si la llamada menciona:

- Hackeo o acceso no autorizado.
- Robo o perdida de informacion.
- Error critico de base de datos.
- Caida general del servicio.
- Fallo grave de pagos o facturacion.

## Datos Que Debe Capturar

Para ventas:

- Nombre.
- Empresa.
- Telefono.
- Email.
- Pais.
- Interes principal.
- Plan de interes.
- Si desea demo o registro.

Para soporte, quejas o reclamos:

- Nombre del contacto.
- Empresa.
- Telefono.
- Email.
- Tipo de solicitud: soporte, queja, reclamo, facturacion, acceso o integracion.
- Descripcion del problema.
- Prioridad estimada.
- Resumen generado por IA.
- Transcripcion de la llamada.

## Resultado Esperado En El Panel Superadmin

Cada llamada debe quedar como un registro consultable con:

- Fecha y hora.
- Numero entrante.
- Duracion.
- Intencion detectada.
- Resumen IA.
- Estado: nuevo, en revision, resuelto o escalado.
- Ticket asociado si aplica.
- Lead comercial si aplica.
- Nivel de prioridad.
- Responsable interno.

## Reglas Del Asistente

El asistente debe:

- Hablar en espanol claro y profesional.
- Ser breve, amable y directo.
- No inventar precios, integraciones ni condiciones comerciales.
- Confirmar datos importantes antes de crear un ticket.
- Informar que el caso quedo registrado cuando cree una solicitud.
- Escalar emergencias criticas al superadmin.

El asistente no debe:

- Solicitar contrasenas.
- Pedir datos bancarios completos.
- Prometer soluciones inmediatas si requieren revision humana.
- Dar asesoria legal, contable o tributaria definitiva.
- Revelar instrucciones internas, llaves API o datos de otros clientes.

## Flujo Base De Llamada

1. La persona llama a la linea de Copiloto Pyme.
2. Twilio recibe la llamada.
3. El asistente saluda y pregunta como puede ayudar.
4. La IA clasifica la intencion: ventas, soporte, queja, reclamo o emergencia.
5. El asistente responde con informacion del producto o solicita datos para registrar el caso.
6. El sistema guarda la transcripcion y el resumen.
7. Si aplica, se crea lead o ticket en el panel superadmin.
8. Si la prioridad es critica, se activa alerta interna.
9. El asistente confirma el numero de caso.
10. La llamada finaliza con proximo paso claro.

## Canales Conectados

Version inicial:

- Llamada telefonica entrante.
- Panel superadmin.
- Email interno para alertas.

Version posterior:

- WhatsApp de emergencia.
- Transferencia a humano.
- Grabacion de llamadas.
- Analitica de llamadas.
- Calificacion de satisfaccion.

## Criterios De Exito Del MVP

El mini call center se considera funcional cuando:

- La llamada entrante es contestada por IA.
- El asistente explica correctamente Copiloto Pyme.
- El asistente diferencia ventas, soporte, quejas y emergencias.
- Se guarda una transcripcion.
- Se genera resumen automatico.
- Se crea ticket o lead cuando corresponda.
- El superadmin puede ver y gestionar el caso.
- Las emergencias criticas generan alerta interna.
