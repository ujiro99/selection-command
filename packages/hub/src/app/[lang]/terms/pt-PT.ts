import { HUB_URL } from "@/const"

const msg = `
Estes Termos de Serviço (doravante designados como "Termos") estabelecem as condições para a utilização do "Selection Command Hub" (doravante designado como "Serviço") fornecido pelo Operador (doravante designado como "nós"). Por favor, leia estes Termos cuidadosamente antes de utilizar o Serviço. Ao utilizar o Serviço, considera-se que concordou com estes Termos.

## 1. Aplicação
1. Estes Termos aplicam-se a todas as relações entre nós e os utilizadores relativas à utilização do Serviço.
2. Quaisquer regras ou diretrizes estabelecidas separadamente por nós relativas ao Serviço constituirão parte destes Termos.

## 2. Descrição do Serviço
1. O Serviço está relacionado com a extensão do Chrome "Selection Command" e fornece as seguintes funcionalidades:
   - A capacidade de os utilizadores publicarem comandos (doravante designados como "Dados Publicados").
   - A capacidade de os utilizadores visualizarem e recuperarem comandos publicados por outros utilizadores.
2. Os Dados Publicados incluem as seguintes informações:
   - O título de uma página web.
   - O URL de uma página web.
   - O ícone de uma página web.
   - A descrição e classificação de um comando.
   - Outras informações necessárias para exibir uma página web.
3. O Serviço não requer registo de utilizador e pode ser utilizado anonimamente.

## 3. Condutas Proibidas
Os utilizadores estão proibidos de se envolverem nas seguintes atividades ao utilizar o Serviço:
- Atos que violem leis ou ordem pública e moral.
- Atos que infrinjam os direitos de outros (por exemplo, direitos de autor, marcas registadas, direitos de privacidade).
- Fornecimento de informações falsas, imprecisas ou prejudiciais como Dados Publicados.
- Atos que causem danos ao Serviço ou a outros utilizadores.
- Qualquer outro ato que consideremos inapropriado.

## 4. Tratamento dos Dados Publicados
1. Os utilizadores são os únicos responsáveis pelos seus Dados Publicados. Uma vez que os Dados Publicados são enviados, não podem ser modificados ou eliminados, pelo que, por favor, tenha cuidado ao publicar conteúdo.
2. Reservamo-nos o direito de eliminar ou tornar privados os Dados Publicados se necessário, mas não somos obrigados a fazê-lo.
3. Se um terceiro apresentar reclamações de violação de direitos relativas aos Dados Publicados, podemos modificar ou eliminar tais dados a nosso critério.
4. É proibida a reprodução, duplicação ou utilização não autorizada dos Dados Publicados ou de qualquer parte do Serviço para fins diferentes da utilização do Serviço.

## 5. Direitos de Propriedade Intelectual e Permissões de Utilização
1. Todos os direitos de propriedade intelectual relacionados com o Serviço pertencem a nós ou aos proprietários legítimos.
2. Os utilizadores mantêm a propriedade dos seus Dados Publicados, mas são considerados como tendo concedido permissão para utilização por outros nas seguintes circunstâncias:
   - Outros utilizadores podem visualizar, recuperar, utilizar, editar e redistribuir os Dados Publicados dentro do âmbito do Serviço.
   - Podemos utilizar, publicar, editar e distribuir os Dados Publicados conforme necessário para operar o Serviço.

## 6. Isenção de Responsabilidade
1. Não garantimos que o Serviço satisfará propósitos específicos, fornecerá utilidade ou assegurará segurança para os utilizadores.
2. Não somos responsáveis por quaisquer danos ou disputas decorrentes dos Dados Publicados ou do seu conteúdo.
3. Também não somos responsáveis por danos resultantes de interrupções ou terminação do Serviço.

## 7. Política de Privacidade
1. O tratamento de informações pessoais e cookies relacionados com a utilização deste serviço será regido pela Política de Privacidade estabelecida separadamente por nós.
2. Para detalhes, por favor, consulte a seguinte página:
   - [Política de Privacidade](${HUB_URL}/pt-PT/privacy)

## 8. Suspensão e Restrições
1. Se um utilizador violar estes Termos, podemos restringir o acesso ou suspender a sua utilização do Serviço sem aviso prévio.

## 9. Alterações e Terminação
1. Reservamo-nos o direito de alterar ou terminar estes Termos e/ou o conteúdo do Serviço sem aviso prévio.
2. A utilização contínua do Serviço após as alterações terem sido feitas constitui aceitação dos novos Termos.

## 10. Contacto de Suporte
Para consultas ou pedidos de suporte relacionados com este Serviço, contacte-nos através de:
- [Página de Suporte da Chrome Web Store](https://chromewebstore.google.com/detail/nlnhbibaommoelemmdfnkjkgoppkohje/support)

## 11. Lei Aplicável e Jurisdição
1. Estes Termos serão regidos pela lei japonesa.
2. Em caso de disputas decorrentes destes Termos ou do Serviço, a jurisdição exclusiva será dos tribunais japoneses.

Efetivo a partir de 01/10/2025
`
export default msg
