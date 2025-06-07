import { HUB_URL } from '@/const'

const msg = `
Estos Términos de Servicio (en adelante, los "Términos") establecen las condiciones para utilizar el "Selection Command Hub" (en adelante, el "Servicio") proporcionado por el Operador (en adelante, "nosotros" o "nos"). Por favor, lea estos Términos cuidadosamente antes de utilizar el Servicio. Al utilizar el Servicio, se considera que ha aceptado estos Términos.

## 1. Aplicación
1. Estos Términos se aplican a todas las relaciones entre nosotros y los usuarios con respecto al uso del Servicio.
2. Cualquier regla o directriz establecida por nosotros por separado con respecto al Servicio constituirá parte de estos Términos.

## 2. Descripción del Servicio
1. El Servicio está relacionado con la extensión de Chrome "Selection Command" y proporciona las siguientes funcionalidades:
   - La capacidad para que los usuarios publiquen comandos (en adelante, "Datos Publicados").
   - La capacidad para que los usuarios vean y recuperen comandos publicados por otros usuarios.
2. Los Datos Publicados incluyen la siguiente información:
   - El título de una página web.
   - La URL de una página web.
   - El icono de una página web.
   - La descripción y clasificación de un comando.
   - Otra información necesaria para mostrar una página web.
3. El Servicio no requiere registro de usuario y puede utilizarse de forma anónima.

## 3. Conductas Prohibidas
Los usuarios tienen prohibido realizar las siguientes actividades al utilizar el Servicio:
- Actos que violen las leyes o el orden público y la moral.
- Actos que infrinjan los derechos de otros (por ejemplo, derechos de autor, marcas registradas, derechos de privacidad).
- Proporcionar información falsa, inexacta o dañina como Datos Publicados.
- Actos que causen daño al Servicio o a otros usuarios.
- Cualquier otro acto que consideremos inapropiado.

## 4. Manejo de Datos Publicados
1. Los usuarios son los únicos responsables de sus Datos Publicados. Una vez que los Datos Publicados se envían, no pueden modificarse ni eliminarse, por lo que tenga cuidado al publicar contenido.
2. Nos reservamos el derecho de eliminar o hacer privados los Datos Publicados si es necesario, pero no estamos obligados a hacerlo.
3. Si un tercero presenta reclamos de infracción de derechos con respecto a los Datos Publicados, podemos modificar o eliminar dichos datos a nuestra discreción.
4. Se prohíbe la reproducción, duplicación o uso no autorizado de los Datos Publicados o cualquier parte del Servicio para fines distintos al uso del Servicio.

## 5. Derechos de Propiedad Intelectual y Permisos de Uso
1. Todos los derechos de propiedad intelectual relacionados con el Servicio pertenecen a nosotros o a los propietarios legítimos.
2. Los usuarios conservan la propiedad de sus Datos Publicados, pero se considera que otorgan permiso para su uso por otros en las siguientes circunstancias:
   - Otros usuarios pueden ver, recuperar, usar, editar y redistribuir los Datos Publicados dentro del alcance del Servicio.
   - Podemos usar, publicar, editar y distribuir los Datos Publicados según sea necesario para operar el Servicio.

## 6. Descargo de Responsabilidad
1. No garantizamos que el Servicio cumpla con propósitos específicos, proporcione utilidad o asegure la seguridad para los usuarios.
2. No somos responsables por daños o disputas que surjan de los Datos Publicados o su contenido.
3. Tampoco somos responsables por daños resultantes de interrupciones o terminación del Servicio.

## 7. Política de Privacidad
1. El manejo de información personal y cookies relacionadas con el uso de este servicio se regirá por la Política de Privacidad establecida por nosotros por separado.
2. Para más detalles, consulte la siguiente página:
   - [Política de Privacidad](${HUB_URL}/es/privacy)

## 8. Suspensión y Restricciones
1. Si un usuario viola estos Términos, podemos restringir el acceso o suspender su uso del Servicio sin previo aviso.

## 9. Cambios y Terminación
1. Nos reservamos el derecho de cambiar o terminar estos Términos y/o el contenido del Servicio sin previo aviso.
2. El uso continuado del Servicio después de que se hayan realizado cambios constituye la aceptación de los nuevos Términos.

## 10. Contacto de Soporte
Para consultas o solicitudes de soporte relacionadas con este Servicio, contáctenos a través de:
- [Página de Soporte de Chrome Web Store](https://chromewebstore.google.com/detail/nlnhbibaommoelemmdfnkjkgoppkohje/support)

## 11. Ley Aplicable y Jurisdicción
1. Estos Términos se regirán por la ley japonesa.
2. En caso de disputas que surjan de estos Términos o del Servicio, la jurisdicción exclusiva corresponderá a los tribunales de Japón.

Efectivo a partir del 01/10/2025
`
export default msg
