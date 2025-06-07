import { HUB_URL } from '@/const'

const msg = `
Esta Política de Privacidad describe cómo se maneja la información del usuario dentro de Selection Command Hub (en adelante, "el Servicio"). Al utilizar el Servicio, se considera que ha aceptado esta Política de Privacidad.

## **1. Información Recopilada**

El Servicio recopila los siguientes tipos de información:

### **1-1. Información de Comandos Publicada por Usuarios**
El Servicio recopila información de comandos publicada por usuarios (por ejemplo, nombres de comandos, URLs, descripciones).  
Para más detalles sobre la configuración, consulte los [Términos de Servicio](${HUB_URL}/es/terms).  
*Nota: Esta información se utiliza solo cuando los usuarios publican o recuperan datos dentro del Servicio.*

### **1-2. Datos de Uso**
El Servicio utiliza Google Analytics para recopilar datos de uso anonimizados. Estos datos incluyen:
- Historial de interacciones (por ejemplo, transiciones de página, ubicaciones y conteos de clics)
- Información del dispositivo (por ejemplo, tipo de navegador, sistema operativo)
- Marcas de tiempo de acceso
- Direcciones IP de origen (procesadas para anonimización)
- Otros datos estadísticos anonimizados proporcionados por Google Analytics

### **1-3. Recopilación de Información Personal**
Como el Servicio no proporciona funcionalidades de registro o inicio de sesión, no recopila información personal identificable (por ejemplo, nombres, direcciones de correo electrónico, direcciones físicas).

## **2. Propósito del Uso de la Información**

La información recopilada se utiliza para los siguientes propósitos:
1. Analizar y mejorar el uso del Servicio
2. Proporcionar las funciones necesarias para operar el Servicio

## **3. Gestión de la Información**

El Servicio gestiona adecuadamente la información recopilada para prevenir accesos no autorizados o violaciones de datos. Los datos recopilados a través de Google Analytics se gestionan de acuerdo con la [Política de Privacidad de Google](https://www.google.com/analytics/terms/us.html).

## **4. Provisión a Terceros**

El Servicio no proporciona la información recopilada a terceros, excepto cuando lo exige la ley. Sin embargo, los datos recopilados a través de Google Analytics son procesados por Google.

## **5. Uso de Cookies**

El Servicio utiliza cookies a través de Google Analytics. Las cookies se almacenan en los navegadores de los usuarios y se utilizan para mejorar la funcionalidad y analizar el comportamiento del usuario dentro del Servicio. Los usuarios pueden deshabilitar las cookies a través de la configuración de su navegador; sin embargo, algunas funciones pueden no funcionar correctamente como resultado.

## **6. Cambios en la Política de Privacidad**

Esta Política de Privacidad puede actualizarse según sea necesario. La política revisada entrará en vigor al ser publicada en esta página.

## **7. Información de Contacto**

Para consultas sobre esta Política de Privacidad, contáctenos a través de:
- [Página de Soporte de Chrome Web Store](https://chromewebstore.google.com/detail/nlnhbibaommoelemmdfnkjkgoppkohje/support)

Vigente a partir del 01/10/2025
`
export default msg
