import { HUB_URL } from "@/const"

const msg = `
Estes Termos de Serviço (doravante referidos como "Termos") estabelecem as condições para o uso do "Selection Command Hub" (doravante referido como "Serviço") fornecido pelo Operador (doravante referido como "nós"). Por favor, leia estes Termos cuidadosamente antes de usar o Serviço. Ao usar o Serviço, você é considerado como tendo concordado com estes Termos.

## 1. Aplicação
1. Estes Termos se aplicam a todos os relacionamentos entre nós e os usuários em relação ao uso do Serviço.
2. Quaisquer regras ou diretrizes estabelecidas separadamente por nós em relação ao Serviço constituirão parte destes Termos.

## 2. Descrição do Serviço
1. O Serviço está relacionado à extensão do Chrome "Selection Command" e fornece as seguintes funcionalidades:
   - A capacidade para os usuários postarem comandos (doravante referidos como "Dados Postados").
   - A capacidade para os usuários visualizarem e recuperarem comandos postados por outros usuários.
2. Os Dados Postados incluem as seguintes informações:
   - O título de uma página web.
   - A URL de uma página web.
   - O ícone de uma página web.
   - A descrição e classificação de um comando.
   - Outras informações necessárias para exibir uma página web.
3. O Serviço não requer registro de usuário e pode ser usado anonimamente.

## 3. Condutas Proibidas
Os usuários estão proibidos de se envolver nas seguintes atividades ao usar o Serviço:
- Atos que violem leis ou ordem pública e moral.
- Atos que infrinjam os direitos de outros (por exemplo, direitos autorais, marcas registradas, direitos de privacidade).
- Fornecimento de informações falsas, imprecisas ou prejudiciais como Dados Postados.
- Atos que causem danos ao Serviço ou a outros usuários.
- Qualquer outro ato que consideremos inapropriado.

## 4. Tratamento dos Dados Postados
1. Os usuários são os únicos responsáveis por seus Dados Postados. Uma vez que os Dados Postados são enviados, não podem ser modificados ou excluídos, então, por favor, tenha cuidado ao postar conteúdo.
2. Reservamo-nos o direito de excluir ou tornar privados os Dados Postados se necessário, mas não somos obrigados a fazê-lo.
3. Se um terceiro apresentar reivindicações de violação de direitos em relação aos Dados Postados, podemos modificar ou excluir tais dados a nosso critério.
4. É proibida a reprodução, duplicação ou uso não autorizado dos Dados Postados ou de qualquer parte do Serviço para fins diferentes do uso do Serviço.

## 5. Direitos de Propriedade Intelectual e Permissões de Uso
1. Todos os direitos de propriedade intelectual relacionados ao Serviço pertencem a nós ou aos proprietários legítimos.
2. Os usuários mantêm a propriedade de seus Dados Postados, mas são considerados como tendo concedido permissão para uso por outros nas seguintes circunstâncias:
   - Outros usuários podem visualizar, recuperar, usar, editar e redistribuir os Dados Postados dentro do escopo do Serviço.
   - Podemos usar, publicar, editar e distribuir os Dados Postados conforme necessário para operar o Serviço.

## 6. Isenção de Responsabilidade
1. Não garantimos que o Serviço atenderá a propósitos específicos, fornecerá utilidade ou assegurará segurança para os usuários.
2. Não somos responsáveis por quaisquer danos ou disputas decorrentes dos Dados Postados ou de seu conteúdo.
3. Também não somos responsáveis por danos resultantes de interrupções ou término do Serviço.

## 7. Política de Privacidade
1. O tratamento de informações pessoais e cookies relacionados ao uso deste serviço será regido pela Política de Privacidade estabelecida separadamente por nós.
2. Para detalhes, por favor, consulte a seguinte página:
   - [Política de Privacidade](${HUB_URL}/pt-BR/privacy)

## 8. Suspensão e Restrições
1. Se um usuário violar estes Termos, podemos restringir o acesso ou suspender seu uso do Serviço sem aviso prévio.

## 9. Alterações e Término
1. Reservamo-nos o direito de alterar ou encerrar estes Termos e/ou o conteúdo do Serviço sem aviso prévio.
2. O uso contínuo do Serviço após as alterações terem sido feitas constitui aceitação dos novos Termos.

## 10. Contato de Suporte
Para consultas ou solicitações de suporte relacionadas a este Serviço, entre em contato conosco através de:
- [Página de Suporte da Chrome Web Store](https://chromewebstore.google.com/detail/nlnhbibaommoelemmdfnkjkgoppkohje/support)

## 11. Lei Aplicável e Jurisdição
1. Estes Termos serão regidos pela lei japonesa.
2. Em caso de disputas decorrentes destes Termos ou do Serviço, a jurisdição exclusiva será dos tribunais japoneses.

Efetivo a partir de 01/10/2025
`
export default msg
